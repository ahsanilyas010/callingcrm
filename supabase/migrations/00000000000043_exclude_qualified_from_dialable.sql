-- A lead whose disposition maps to 'qualified' (connected_interested,
-- appointment_set) was never excluded from the cold-dial queue here —
-- only converted/rejected/suppressed/unreachable were. 'appointment_set'
-- is_terminal=true and requires_followup=true, but "Book callback" in the
-- workspace is an optional checkbox, not an enforced one: an agent can log
-- the disposition without setting a callback time, leaving next_action_at
-- null, which (null passes the "due" check trivially) put the lead right
-- back in front of the next agent to dial — even though it already has a
-- real appointment booked with a closer. A qualified lead needs to move to
-- the appointment/follow-up track, never back into blind cold-dialing.
create or replace view v_dialable_leads
with (security_invoker = true) as
select l.*, c.code as campaign_code, c.market,
       (now() at time zone coalesce(l.lead_timezone, 'UTC'))::time as lead_local_time
from leads l
join campaigns c on c.id = l.campaign_id
left join suppression_list s on s.phone_e164 = l.phone_e164
where c.is_active
  and not l.do_not_call
  and s.phone_e164 is null
  and l.screening_status = 'passed'
  and l.screened_at > now() - (c.screening_max_age_days || ' days')::interval
  and l.status not in ('converted','rejected','suppressed','unreachable','qualified')
  and l.attempt_count < c.max_attempts
  and (l.last_attempt_at is null
       or l.last_attempt_at < now() - (c.min_hours_between_attempts || ' hours')::interval)
  and (l.next_action_at is null or l.next_action_at <= now())
  and (now() at time zone coalesce(l.lead_timezone,'UTC'))::time
      between c.call_window_start and c.call_window_end
  and extract(isodow from (now() at time zone coalesce(l.lead_timezone,'UTC')))::int
      = any(c.call_days);
