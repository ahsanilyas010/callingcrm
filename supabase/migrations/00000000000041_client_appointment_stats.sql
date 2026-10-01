-- Aggregate-only appointment counts for the client dashboard (Section 6.6:
-- client stakeholders get numbers, never a lead list or agent names — same
-- self-scoping pattern as get_client_funnel() in migration 27).
create type client_appointment_stats as (
  booked bigint,
  confirmed bigint,
  completed bigint,
  follow_up bigint
);

create or replace function get_client_appointment_stats(p_client_id uuid default null)
returns client_appointment_stats
language plpgsql security definer set search_path = public as $$
declare
  v_client_id uuid;
  v_result client_appointment_stats;
begin
  if auth_role() = 'client_viewer' then
    select client_id into v_client_id from profiles where id = auth.uid();
    if v_client_id is null then
      return v_result; -- account has no client linked yet: nothing to show, not an error
    end if;
  elsif is_manager() then
    v_client_id := p_client_id; -- null = every client
  else
    raise exception 'not authorized';
  end if;

  select
    count(a.id) filter (where a.status in ('pending', 'confirmed')),
    count(a.id) filter (where a.status = 'confirmed'),
    count(a.id) filter (where a.status = 'completed'),
    count(a.id) filter (where a.status = 'follow_up')
  into v_result
  from appointments a
  join campaigns c on c.id = a.campaign_id
  where (v_client_id is null or c.client_id = v_client_id);

  return v_result;
end;
$$;

revoke execute on function get_client_appointment_stats(uuid) from public, anon;
grant execute on function get_client_appointment_stats(uuid) to authenticated;
