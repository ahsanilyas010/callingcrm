import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth/current-profile";
import { Badge } from "@/components/ui/badge";
import { AddLeadDialog } from "./add-lead-dialog";
import { LeadRowActions } from "./lead-row-actions";
import { AutoAssignButton } from "./auto-assign-button";

const SCREENING_BADGE: Record<string, React.ComponentProps<typeof Badge>["variant"]> = {
  passed: "confirm",
  unscreened: "danger",
  blocked: "danger",
  expired: "warning",
  pending: "warning",
};

export default async function CampaignDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const profile = await requireProfile();
  if (!["super_admin", "ops_manager"].includes(profile.role)) redirect("/");

  const supabase = await createClient();
  const [{ data: campaign }, { data: leads }, { data: dataSources }, { data: agents }] = await Promise.all([
    supabase.from("campaigns").select("*, clients(name)").eq("id", id).single(),
    supabase
      .from("leads")
      .select("*, profiles(full_name)")
      .eq("campaign_id", id)
      .order("created_at", { ascending: false })
      .limit(200),
    supabase.from("data_sources").select("*").eq("is_active", true).order("name"),
    supabase.from("campaign_assignments").select("user_id, profiles(full_name)").eq("campaign_id", id),
  ]);

  if (!campaign) notFound();

  return (
    <div className="p-4">
      <Link
        href="/admin/campaigns"
        className="mb-3 inline-flex items-center gap-1 text-xs text-muted hover:text-ink"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> All campaigns
      </Link>

      <div className="mb-4 flex items-start justify-between">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-semibold text-ink">
            {campaign.name}
            <Badge variant="blue">{campaign.market}</Badge>
          </h2>
          <p className="tabular text-xs text-muted">
            {campaign.code} · {(campaign as { clients?: { name: string } | null }).clients?.name} ·{" "}
            {(agents ?? []).length} agents assigned
          </p>
        </div>
        <div className="flex items-center gap-2">
          <AutoAssignButton campaignId={campaign.id} />
          <AddLeadDialog campaignId={campaign.id} dataSources={dataSources ?? []} />
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border border-line bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-line bg-canvas text-left text-xs text-muted">
              <th className="px-3 py-2 font-medium">Name</th>
              <th className="px-3 py-2 font-medium">Phone</th>
              <th className="px-3 py-2 font-medium">Location</th>
              <th className="px-3 py-2 font-medium">Assigned to</th>
              <th className="px-3 py-2 font-medium">Status</th>
              <th className="px-3 py-2 font-medium">Screening</th>
              <th className="px-3 py-2 font-medium">Attempts</th>
              <th className="px-3 py-2 font-medium" />
            </tr>
          </thead>
          <tbody>
            {(leads ?? []).map((l) => (
              <tr key={l.id} className="h-[38px] border-b border-line last:border-0">
                <td className="px-3 py-1.5 font-medium text-ink">
                  {[l.first_name, l.last_name].filter(Boolean).join(" ") || "—"}
                </td>
                <td className="px-3 py-1.5 tabular">{l.phone_e164}</td>
                <td className="px-3 py-1.5 text-muted">
                  {[l.city, l.region].filter(Boolean).join(", ") || "—"}
                </td>
                <td className="px-3 py-1.5 text-muted">
                  {(l as { profiles?: { full_name: string } | null }).profiles?.full_name ?? (
                    <span className="text-warning">Unassigned</span>
                  )}
                </td>
                <td className="px-3 py-1.5">
                  {l.do_not_call ? (
                    <Badge variant="danger">Suppressed</Badge>
                  ) : (
                    <Badge variant="neutral">{l.status.replace(/_/g, " ")}</Badge>
                  )}
                </td>
                <td className="px-3 py-1.5">
                  <Badge variant={SCREENING_BADGE[l.screening_status] ?? "neutral"}>
                    {l.screening_status}
                  </Badge>
                </td>
                <td className="px-3 py-1.5 tabular text-muted">
                  {l.attempt_count} / {campaign.max_attempts}
                </td>
                <td className="px-3 py-1.5 text-right">
                  <LeadRowActions
                    leadId={l.id}
                    screeningStatus={l.screening_status}
                    doNotCall={l.do_not_call}
                    assignedTo={l.assigned_to}
                    agents={(agents ?? []).map((a) => ({
                      id: a.user_id,
                      name: (a as { profiles?: { full_name: string } | null }).profiles?.full_name ?? "—",
                    }))}
                  />
                </td>
              </tr>
            ))}
            {(leads ?? []).length === 0 && (
              <tr>
                <td colSpan={8} className="px-3 py-8 text-center text-sm text-muted">
                  No leads yet. Add one, or wait for the bulk import wizard (Phase 7).
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <p className="mt-3 text-[11px] text-muted">
        Every lead here passed the internal suppression check at entry. Screening still needs to
        be marked passed, then assigned to an agent (individually or via Auto-assign), before it
        becomes dialable in that agent&rsquo;s workspace.
      </p>
    </div>
  );
}
