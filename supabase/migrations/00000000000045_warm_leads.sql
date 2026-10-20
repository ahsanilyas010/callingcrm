-- Warm-leads screening (Nehal Syed / ops_manager): when an agent logs
-- 'connected_interested', 'interested_follow_up', or 'appointment_set', the
-- lead is routed to a dedicated screener queue — deliberately NOT the
-- appointments table (appointments is closer/meeting-booking; this is a
-- pre-qualification screen that can also conclude "not actually warm" and
-- hand the lead back to the agent). Mirrors appointments' shape closely
-- (same round-robin assignment via campaign_closers, same append-only
-- status history) but is a parallel table by design.
--
-- Note: 'appointment_set' triggers BOTH this table's insert AND the
-- existing appointments insert in record_call_attempt() (migration 46) —
-- the same call creates an appointments row (closer books a meeting) and a
-- warm_leads row (Nehal screens it) for the same disposition. Flagged as
-- intentional per the explicit product decision, not an oversight.

create type warm_lead_status as enum (
  'pending',    -- routed to screener, not yet actioned
  'in_review',  -- screener has started working it
  'converted',  -- screener confirms it's a real, viable lead — terminal, no loop-back
  'follow_up',  -- needs the agent to touch it again — loops back to a followups row
  'lost'        -- not viable after screening — loops back to a followups row too, so
                -- the agent's queue reflects the final word
);

create table warm_leads (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references leads(id),
  campaign_id uuid not null references campaigns(id),
  disposition_code text not null,                      -- which of the 3 trigger codes caused this
  created_by uuid not null references profiles(id),     -- the agent
  assigned_screener_id uuid references profiles(id),    -- the screener (round-robin over campaign_closers)
  status warm_lead_status not null default 'pending',
  agent_notes text,                                     -- the agent's call note, copied in for context
  screener_notes text,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index warm_leads_screener_idx on warm_leads (assigned_screener_id, status);
create index warm_leads_campaign_idx on warm_leads (campaign_id, status);
create index warm_leads_lead_idx on warm_leads (lead_id, created_at desc);
create index warm_leads_agent_idx on warm_leads (created_by, created_at desc);

alter table warm_leads enable row level security;

create policy warm_leads_select on warm_leads for select using (
  created_by = auth.uid()
  or assigned_screener_id = auth.uid()
  or is_manager()
  or (auth_role() = 'team_lead' and created_by in (select my_team_members()))
);
-- No client insert policy: warm leads are only ever created inside
-- record_call_attempt() (SECURITY DEFINER), same reasoning as appointments.
create policy warm_leads_update on warm_leads for update using (
  assigned_screener_id = auth.uid() or is_manager()
);

grant select, update on warm_leads to authenticated;

create table warm_lead_status_history (
  id uuid primary key default gen_random_uuid(),
  warm_lead_id uuid not null references warm_leads(id) on delete cascade,
  status warm_lead_status not null,
  note text,
  changed_by uuid not null references profiles(id),
  changed_at timestamptz not null default now()
);
create index warm_lead_status_history_idx on warm_lead_status_history (warm_lead_id, changed_at desc);

alter table warm_lead_status_history enable row level security;

create policy warm_lead_status_history_select on warm_lead_status_history for select using (
  exists (
    select 1 from warm_leads w
    where w.id = warm_lead_id
      and (w.created_by = auth.uid() or w.assigned_screener_id = auth.uid() or is_manager()
           or (auth_role() = 'team_lead' and w.created_by in (select my_team_members())))
  )
);
create policy warm_lead_status_history_insert on warm_lead_status_history for insert with check (
  exists (
    select 1 from warm_leads w
    where w.id = warm_lead_id and (w.assigned_screener_id = auth.uid() or is_manager())
  )
);

grant select, insert on warm_lead_status_history to authenticated;

create trigger warm_leads_set_updated_at
  before update on warm_leads
  for each row execute function set_updated_at();

-- The screener's dashboard needs live updates the same way the follow-up
-- tray does (00000000000020_followups_realtime.sql) — a new warm lead
-- should appear without a manual refresh.
alter publication supabase_realtime add table warm_leads;

-- The one write path for a warm lead's status — mirrors
-- update_appointment_status(), plus the loop-back requirement: any status
-- OTHER than 'converted' creates a followups row for the ORIGINAL AGENT
-- (warm_leads.created_by), carrying the screener's note, atomically with
-- the status write and its history row. SECURITY DEFINER here
-- deliberately bypasses followups_insert's RLS (assigned_to = auth.uid()
-- OR is_manager()) — the screener is not the assignee and isn't
-- guaranteed to be a manager, so without this the loop-back write would be
-- rejected outright. Same bypass pattern record_call_attempt() already
-- uses for suppression_list and appointments.
create or replace function update_warm_lead_status(
  p_warm_lead_id uuid,
  p_status warm_lead_status,
  p_note text default null
) returns void
language plpgsql security definer set search_path = public as $$
declare
  v_warm_lead warm_leads%rowtype;
begin
  select * into v_warm_lead from warm_leads where id = p_warm_lead_id for update;
  if not found then
    raise exception 'warm lead not found';
  end if;
  if not (is_manager() or v_warm_lead.assigned_screener_id = auth.uid()) then
    raise exception 'not your warm lead to update';
  end if;

  update warm_leads set
    status = p_status,
    screener_notes = coalesce(p_note, screener_notes),
    reviewed_at = case when p_status <> 'pending' then now() else reviewed_at end
  where id = p_warm_lead_id;

  insert into warm_lead_status_history (warm_lead_id, status, note, changed_by)
  values (p_warm_lead_id, p_status, p_note, auth.uid());

  -- Loop-back: anything other than 'converted' hands the lead back to the
  -- agent's follow-up queue with the screener's note attached. due_at =
  -- now(): the agent should act on a screener's verdict promptly, not wait
  -- for some future callback time nobody specified.
  if p_status <> 'converted' then
    insert into followups (
      lead_id, campaign_id, assigned_to, created_by, followup_type, due_at,
      note, priority
    ) values (
      v_warm_lead.lead_id,
      v_warm_lead.campaign_id,
      v_warm_lead.created_by,
      auth.uid(),
      'callback',
      now(),
      coalesce('Screener (' || p_status::text || '): ' || p_note, 'Screener marked ' || p_status::text),
      case when p_status = 'lost' then 'high' else 'normal' end
    );
  end if;
end;
$$;

revoke execute on function update_warm_lead_status(uuid, warm_lead_status, text) from public, anon;
grant execute on function update_warm_lead_status(uuid, warm_lead_status, text) to authenticated;
