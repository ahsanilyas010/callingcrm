import { requireProfile } from "@/lib/auth/current-profile";
import { getAssignedCampaigns, getNextLead, getDispositions, getQueueCounts } from "@/lib/actions/workspace";
import { Workspace } from "./workspace";
import { NoCampaignAssigned } from "./no-campaign-assigned";

export default async function WorkspacePage({
  searchParams,
}: {
  searchParams: Promise<{ campaign?: string }>;
}) {
  const profile = await requireProfile();
  const campaigns = await getAssignedCampaigns();

  if (campaigns.length === 0) {
    return <NoCampaignAssigned agentName={profile.full_name} />;
  }

  // An agent can be assigned to more than one campaign at once
  // (campaign_assignments is many-to-many) — ?campaign= picks which one
  // this dial session works, defaulting to the first when absent or
  // pointing at a campaign this agent isn't actually assigned to.
  const { campaign: campaignId } = await searchParams;
  const campaign = campaigns.find((c) => c.id === campaignId) ?? campaigns[0];

  const [lead, dispositions, counts] = await Promise.all([
    getNextLead(campaign.id),
    getDispositions(campaign.id),
    getQueueCounts(campaign.id),
  ]);

  return (
    <Workspace
      key={campaign.id}
      agentName={profile.full_name}
      agentTimezone={profile.timezone}
      campaign={campaign}
      campaigns={campaigns}
      initialLead={lead}
      dispositions={dispositions}
      initialCounts={counts}
    />
  );
}
