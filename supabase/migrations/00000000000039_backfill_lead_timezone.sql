-- lead_timezone was never populated by any insert path (manual entry, CSV/
-- connector pipeline, or promote_unphoned_contact) — every lead in the
-- system has it null, which v_dialable_leads' call-window check silently
-- treats as UTC. That's wrong for every current market (GB, PK) and
-- doesn't track DST even for a market that happens to sit near UTC — it's
-- why agents were seeing zero dialable leads outside a ~UTC daytime
-- window regardless of their leads' actual local time, and (worse) why PK
-- leads were being call-window-checked against UK/UTC hours instead of
-- their own.
--
-- 1. Backfill every existing lead from its country_code, using an IANA
--    zone name (not a fixed offset) so Postgres's tzdata keeps applying
--    DST correctly going forward, not just today.
update leads set lead_timezone = case country_code
  when 'GB' then 'Europe/London'
  when 'PK' then 'Asia/Karachi'
  when 'US' then 'America/New_York'
  else 'UTC'
end
where lead_timezone is null;

-- 2. promote_unphoned_contact() is the one remaining insert path that
--    still wouldn't set it (the two application-code paths — the CSV/
--    connector pipeline and manual entry — were fixed in the same commit
--    as this migration). Same country-code mapping as above.
create or replace function public.promote_unphoned_contact(
  p_contact_id uuid,
  p_phone_e164 text,
  p_phone_raw text
) returns uuid
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_contact unphoned_contacts%rowtype;
  v_suppressed boolean;
  v_lead_id uuid;
begin
  select * into v_contact from unphoned_contacts where id = p_contact_id for update;
  if not found then
    raise exception 'contact not found';
  end if;

  if v_contact.promoted_lead_id is not null then
    raise exception 'this contact has already been queued as a lead';
  end if;

  if not (is_manager() or v_contact.assigned_to = auth.uid()) then
    raise exception 'this contact is not assigned to you';
  end if;

  select exists(select 1 from suppression_list where phone_e164 = p_phone_e164) into v_suppressed;

  insert into leads (
    campaign_id, data_source_id, external_ref, first_name, last_name,
    phone_e164, phone_raw, email, city, country_code, lead_timezone, custom,
    status, screening_status, do_not_call, assigned_to, assigned_at
  ) values (
    v_contact.campaign_id, v_contact.data_source_id,
    v_contact.project_ref || '#' || v_contact.person_ref,
    v_contact.first_name, v_contact.last_name,
    p_phone_e164, p_phone_raw, v_contact.email, v_contact.project_town, v_contact.country_hint,
    case v_contact.country_hint
      when 'GB' then 'Europe/London'
      when 'PK' then 'Asia/Karachi'
      when 'US' then 'America/New_York'
      else 'UTC'
    end,
    v_contact.custom,
    case when v_suppressed then 'suppressed' else 'new' end,
    case when v_suppressed then 'blocked' else 'unscreened' end,
    v_suppressed,
    v_contact.assigned_to, now()
  )
  returning id into v_lead_id;

  update unphoned_contacts
    set promoted_lead_id = v_lead_id, promoted_at = now(), phone_raw = p_phone_raw
    where id = p_contact_id;

  return v_lead_id;
end;
$function$;
