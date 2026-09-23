-- Grant demo_ops read access to the real campaigns table, same shape as
-- the existing qa grant on this policy — everything else stays fail-closed
-- by default since is_manager() and every other RLS policy explicitly
-- enumerate roles rather than allowing "any authenticated user".
drop policy if exists campaigns_select on campaigns;
create policy campaigns_select on campaigns for select using (
  is_manager() or auth_role() in ('qa', 'demo_ops')
  or exists (select 1 from campaign_assignments ca
             where ca.campaign_id = campaigns.id and ca.user_id = auth.uid())
  or (auth_role() = 'client_viewer'
      and client_id = (select client_id from profiles where id = auth.uid()))
  or auth_role() = 'team_lead'
);
