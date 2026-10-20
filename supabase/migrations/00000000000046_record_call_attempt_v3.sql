-- record_call_attempt() v3 — same body as migration 40's version, plus two
-- additions:
--
-- 1. Routes a lead into warm_leads (migration 45) for the three
--    screener-triggering disposition codes, round-robining across
--    campaign_closers exactly like the existing appointment_set branch
--    (same roster, same "fewest open items" tie-break, just counted
--    against warm_leads instead of appointments).
--
-- 2. Folds the followups insert that submitCallAttempt() (workspace.ts)
--    used to do as a SEPARATE client-side insert AFTER this RPC had
--    already committed — if that second insert failed, the call was still
--    reported ok:true with only a client-side warning, so
--    leads.next_action_at (committed here) and followups (committed or
--    not, separately) could silently diverge. Now one transaction. Keyed
--    off the same condition that puts the callback-date field in front of
--    the agent in the first place (requires_followup), AND an actual date
--    being given (p_next_action_at not null) — an agent can tick a
--    requires_followup disposition without booking a callback time, in
--    which case no followup row should be created, matching prior
--    behaviour.
create or replace function record_call_attempt(
  p_lead_id uuid,
  p_disposition_code text,
  p_notes text default null,
  p_wrap_seconds int default null,
  p_next_action_at timestamptz default null
) returns uuid
language plpgsql security definer set search_path = public as $$
declare
  v_lead leads%rowtype;
  v_campaign campaigns%rowtype;
  v_disposition dispositions%rowtype;
  v_attempt_id uuid;
  v_within_window boolean;
  v_new_status lead_status;
  v_closer_id uuid;
  v_screener_id uuid;
begin
  select * into v_lead from leads where id = p_lead_id for update;
  if not found then
    raise exception 'lead not found';
  end if;

  if not (is_manager() or v_lead.assigned_to = auth.uid()) then
    raise exception 'this lead is not assigned to you';
  end if;

  select * into v_campaign from campaigns where id = v_lead.campaign_id;

  select * into v_disposition from dispositions
    where code = p_disposition_code
      and (campaign_id is null or campaign_id = v_campaign.id)
    order by campaign_id nulls last
    limit 1;
  if not found then
    raise exception 'unknown disposition code %', p_disposition_code;
  end if;

  if v_disposition.requires_note and coalesce(trim(p_notes), '') = '' then
    raise exception 'this disposition requires a note';
  end if;

  v_within_window :=
    (now() at time zone coalesce(v_lead.lead_timezone, 'UTC'))::time
      between v_campaign.call_window_start and v_campaign.call_window_end
    and extract(isodow from (now() at time zone coalesce(v_lead.lead_timezone, 'UTC')))::int
      = any(v_campaign.call_days);

  insert into call_attempts (
    lead_id, campaign_id, agent_id, attempt_no, disposition_id,
    ended_at, wrap_seconds, notes, lead_local_time, within_call_window
  ) values (
    p_lead_id, v_campaign.id, auth.uid(), v_lead.attempt_count + 1, v_disposition.id,
    now(), p_wrap_seconds, p_notes, now(), v_within_window
  ) returning id into v_attempt_id;

  v_new_status := case
    when v_disposition.sets_dnc then 'suppressed'
    when v_disposition.code = 'connected_interested' then 'qualified'
    when v_disposition.code = 'appointment_set' then 'qualified'
    when v_disposition.code = 'connected_callback' then 'callback'
    when v_disposition.code in ('connected_wrong_number', 'invalid_number') then 'unreachable'
    when v_disposition.is_terminal then 'rejected'
    else 'in_progress'
  end;

  update leads set
    attempt_count = v_lead.attempt_count + 1,
    last_attempt_at = now(),
    last_disposition_id = v_disposition.id,
    status = v_new_status,
    next_action_at = p_next_action_at,
    do_not_call = do_not_call or v_disposition.sets_dnc
  where id = p_lead_id;

  if v_disposition.sets_dnc then
    insert into suppression_list (phone_e164, reason, added_by, lead_id, evidence_note)
    values (v_lead.phone_e164, 'verbal_dnc', auth.uid(), v_lead.id, p_notes)
    on conflict (phone_e164) do update
      set reason = excluded.reason, evidence_note = excluded.evidence_note;
  end if;

  if v_disposition.code = 'appointment_set' then
    select cc.user_id into v_closer_id
    from campaign_closers cc
    where cc.campaign_id = v_campaign.id
    order by (
      select count(*) from appointments a
      where a.assigned_closer_id = cc.user_id and a.status in ('pending', 'confirmed')
    ) asc, cc.created_at asc
    limit 1;

    insert into appointments (lead_id, campaign_id, created_by, assigned_closer_id, scheduled_at)
    values (p_lead_id, v_campaign.id, auth.uid(), v_closer_id, p_next_action_at);
  end if;

  -- Warm-lead screening routing (new). Same roster and load-balancing rule
  -- as the appointments branch above, balanced against warm_leads' own
  -- open-item count ('pending'/'in_review') instead of appointments'.
  -- appointment_set deliberately ends up in both branches — see migration
  -- 45's header comment.
  if v_disposition.code in ('connected_interested', 'interested_follow_up', 'appointment_set') then
    select cc.user_id into v_screener_id
    from campaign_closers cc
    where cc.campaign_id = v_campaign.id
    order by (
      select count(*) from warm_leads w
      where w.assigned_screener_id = cc.user_id and w.status in ('pending', 'in_review')
    ) asc, cc.created_at asc
    limit 1;

    insert into warm_leads (lead_id, campaign_id, disposition_code, created_by, assigned_screener_id, agent_notes)
    values (p_lead_id, v_campaign.id, v_disposition.code, auth.uid(), v_screener_id, p_notes);
  end if;

  -- Follow-up row, folded in from the client (see header comment above).
  -- due_at_lead_local = p_next_action_at: the client already converts the
  -- agent's local callback-time input to UTC before calling this RPC, same
  -- value used for both columns as the old client-side insert did.
  if v_disposition.requires_followup and p_next_action_at is not null then
    insert into followups (
      lead_id, campaign_id, assigned_to, created_by, followup_type, due_at,
      due_at_lead_local, note
    ) values (
      p_lead_id, v_campaign.id, auth.uid(), auth.uid(), 'callback', p_next_action_at,
      p_next_action_at, p_notes
    );
  end if;

  return v_attempt_id;
end;
$$;

revoke execute on function record_call_attempt(uuid, text, text, int, timestamptz) from public, anon;
grant execute on function record_call_attempt(uuid, text, text, int, timestamptz) to authenticated;
