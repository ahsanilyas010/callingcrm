-- demo_ops now shows fabricated campaign names too (no real data of any
-- kind), so it no longer needs read access to the real campaigns table.
-- Reverts the grant added in 00000000000037.
drop policy if exists campaigns_select on campaigns;
create policy campaigns_select on campaigns for select using (
  is_manager() or auth_role() = 'qa'
  or exists (select 1 from campaign_assignments ca
             where ca.campaign_id = campaigns.id and ca.user_id = auth.uid())
  or (auth_role() = 'client_viewer'
      and client_id = (select client_id from profiles where id = auth.uid()))
  or auth_role() = 'team_lead'
);
