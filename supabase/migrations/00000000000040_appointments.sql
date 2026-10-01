-- Appointment / closer-handoff automation (replaces a manual Google Sheet +
-- WhatsApp handoff). When an agent logs the 'appointment_set' disposition,
-- the lead becomes 'qualified' (previously a bug — see below) and an
-- appointment is created and load-balanced across that campaign's
-- configured closers, atomically with the call log, for the same reason
-- record_call_attempt() already does the DNC-suppression insert in the
-- same transaction: a crash between separate client-side inserts would
-- leave an appointment un-logged or mis-assigned.

create type appointment_status as enum (
  'pending',    -- agent booked it, closer hasn't acted yet
  'confirmed',  -- closer confirmed a time with the contact
  'completed',  -- meeting/call happened
  'follow_up',  -- closer tried, no firm answer yet — needs another touch
  'lost'        -- declined / no longer interested
);

-- Which staff accounts are eligible closers for a given campaign. Kept
-- separate from campaign_assignments (which is about who dials leads) since
-- a closer's job is categorically different and a campaign can have zero,
-- one, or several.
create table campaign_closers (
  campaign_id uuid not null references campaigns(id) on delete cascade,
  user_id uuid not null references profiles(id),
  created_at timestamptz not null default now(),
  primary key (campaign_id, user_id)
);

alter table campaign_closers enable row level security;

create policy campaign_closers_select on campaign_closers for select using (
  is_manager()
  or user_id = auth.uid()
  or (auth_role() = 'team_lead' and user_id in (select my_team_members()))
);
create policy campaign_closers_write on campaign_closers for all
  using (is_manager()) with check (is_manager());

grant select, insert, update, delete on campaign_closers to authenticated;

create table appointments (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references leads(id),
  campaign_id uuid not null references campaigns(id),
  created_by uuid not null references profiles(id),
  assigned_closer_id uuid references profiles(id),
  status appointment_status not null default 'pending',
  scheduled_at timestamptz,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index appointments_closer_idx on appointments (assigned_closer_id, status);
create index appointments_campaign_idx on appointments (campaign_id, status);
create index appointments_lead_idx on appointments (lead_id, created_at desc);

alter table appointments enable row level security;

create policy appointments_select on appointments for select using (
  created_by = auth.uid()
  or assigned_closer_id = auth.uid()
  or is_manager()
  or (auth_role() = 'team_lead' and created_by in (select my_team_members()))
);
-- No client insert policy: appointments are only ever created inside
-- record_call_attempt() below (SECURITY DEFINER), the same way
-- suppression_list rows are — never directly from the client.
create policy appointments_update on appointments for update using (
  assigned_closer_id = auth.uid() or is_manager()
);

grant select, update on appointments to authenticated;

-- Append-only log of status changes — gives a real history instead of the
-- spreadsheet's single overwritten "Remarks" cell.
create table appointment_status_history (
  id uuid primary key default gen_random_uuid(),
  appointment_id uuid not null references appointments(id) on delete cascade,
  status appointment_status not null,
  note text,
  changed_by uuid not null references profiles(id),
  changed_at timestamptz not null default now()
);
create index appointment_status_history_idx on appointment_status_history (appointment_id, changed_at desc);

alter table appointment_status_history enable row level security;

create policy appointment_status_history_select on appointment_status_history for select using (
  exists (
    select 1 from appointments a
    where a.id = appointment_id
      and (a.created_by = auth.uid() or a.assigned_closer_id = auth.uid() or is_manager()
           or (auth_role() = 'team_lead' and a.created_by in (select my_team_members())))
  )
);
create policy appointment_status_history_insert on appointment_status_history for insert with check (
  exists (
    select 1 from appointments a
    where a.id = appointment_id and (a.assigned_closer_id = auth.uid() or is_manager())
  )
);

grant select, insert on appointment_status_history to authenticated;

create trigger appointments_set_updated_at
  before update on appointments
  for each row execute function set_updated_at();

-- Updates status + notes and appends the history row in one call — the one
-- path both the closer's and manager's UI use, so a status change can never
-- happen without a corresponding history entry.
create or replace function update_appointment_status(
  p_appointment_id uuid,
  p_status appointment_status,
  p_note text default null
) returns void
language plpgsql security definer set search_path = public as $$
declare
  v_appointment appointments%rowtype;
begin
  select * into v_appointment from appointments where id = p_appointment_id for update;
  if not found then
    raise exception 'appointment not found';
  end if;
  if not (is_manager() or v_appointment.assigned_closer_id = auth.uid()) then
    raise exception 'not your appointment to update';
  end if;

  update appointments set status = p_status, notes = coalesce(p_note, notes)
  where id = p_appointment_id;

  insert into appointment_status_history (appointment_id, status, note, changed_by)
  values (p_appointment_id, p_status, p_note, auth.uid());
end;
$$;

revoke execute on function update_appointment_status(uuid, appointment_status, text) from public, anon;
grant execute on function update_appointment_status(uuid, appointment_status, text) to authenticated;

-- record_call_attempt(): same body as migration 00000000000013, plus (1) the
-- 'appointment_set' -> 'qualified' branch it was missing (it fell through
-- to the generic is_terminal -> 'rejected' case, so logging the exact
-- disposition for a qualified appointment was marking the lead rejected),
-- and (2) creating + load-balancing the appointment row when that
-- disposition is logged.
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
    -- Load-balance across this campaign's configured closers: whichever
    -- eligible closer currently has the fewest still-open appointments.
    -- Ties broken by campaign_closers insertion order (stable, not random).
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

  return v_attempt_id;
end;
$$;

revoke execute on function record_call_attempt(uuid, text, text, int, timestamptz) from public, anon;
grant execute on function record_call_attempt(uuid, text, text, int, timestamptz) to authenticated;

-- Seed the one closer relationship that exists today: Nehal Syed for D&P
-- Brothers. More campaigns/closers are added via the admin UI from here.
insert into campaign_closers (campaign_id, user_id)
select c.id, p.id
from campaigns c, profiles p
where c.code = 'D&P-0099'
  and p.id = '2d9223bc-ed76-4f3d-9258-f94aeaa1c72e'
on conflict do nothing;
