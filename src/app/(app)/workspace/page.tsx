import { cookies } from "next/headers";
import { requireProfile } from "@/lib/auth/current-profile";
import { getAssignedCampaigns, getNextLead, getDispositions, getQueueCounts } from "@/lib/actions/workspace";
import { Workspace, WORKSPACE_CAMPAIGN_COOKIE } from "./workspace";
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
  // this dial session works. getAssignedCampaigns() has no explicit order,
  // so campaigns[0] is effectively arbitrary; without the cookie fallback,
  // every plain link back to /workspace (the sidebar nav item, "Save &
  // next" after a disposition) silently dropped the agent back onto
  // whichever campaign that happens to be, even mid-session on a different
  // one — reported as "campaign switches back to D&P on its own."
  const cookieStore = await cookies();
  const campaignId = (await searchParams).campaign ?? cookieStore.get(WORKSPACE_CAMPAIGN_COOKIE)?.value;
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
