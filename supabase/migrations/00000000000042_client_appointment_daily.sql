-- Date-wise appointment breakdown for the client dashboard — same
-- aggregate-only, self-scoping pattern as get_client_appointment_stats()
-- (migration 41), just grouped by day instead of collapsed into one total.
create type client_appointment_daily_row as (
  day date,
  booked bigint,
  confirmed bigint,
  completed bigint,
  follow_up bigint
);

create or replace function get_client_appointment_daily(p_client_id uuid default null, p_days int default 14)
returns setof client_appointment_daily_row
language plpgsql security definer set search_path = public as $$
declare
  v_client_id uuid;
begin
  if auth_role() = 'client_viewer' then
    select client_id into v_client_id from profiles where id = auth.uid();
    if v_client_id is null then
      return; -- account has no client linked yet: nothing to show, not an error
    end if;
  elsif is_manager() then
    v_client_id := p_client_id; -- null = every client
  else
    raise exception 'not authorized';
  end if;

  return query
    select
      d::date as day,
      count(a.id) filter (where a.status in ('pending', 'confirmed')) as booked,
      count(a.id) filter (where a.status = 'confirmed') as confirmed,
      count(a.id) filter (where a.status = 'completed') as completed,
      count(a.id) filter (where a.status = 'follow_up') as follow_up
    from generate_series(current_date - (p_days - 1), current_date, interval '1 day') d
    left join appointments a
      on a.created_at::date = d::date
      and exists (
        select 1 from campaigns c
        where c.id = a.campaign_id and (v_client_id is null or c.client_id = v_client_id)
      )
    group by d
    order by d;
end;
$$;

revoke execute on function get_client_appointment_daily(uuid, int) from public, anon;
grant execute on function get_client_appointment_daily(uuid, int) to authenticated;
