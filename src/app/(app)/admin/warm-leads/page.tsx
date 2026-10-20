import { redirect } from "next/navigation";
import { requireProfile } from "@/lib/auth/current-profile";
import { createClient } from "@/lib/supabase/server";
import { WarmLeadsTable, type WarmLeadTableRow } from "./warm-leads-table";

export default async function WarmLeadsPage() {
  const profile = await requireProfile();
  if (!["super_admin", "ops_manager", "team_lead"].includes(profile.role)) redirect("/");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // RLS (warm_leads_select) already scopes this to the caller's own
  // surfaced leads, their screener assignments, their team (team_lead), or
  // everything (is_manager()) — this page is simply the full table over
  // whatever that resolves to, with client-side filters on top.
  const { data: warmLeads } = await supabase
    .from("warm_leads")
    .select(
      "id, lead_id, status, disposition_code, agent_notes, screener_notes, created_at, lead:leads(first_name, last_name, company_name, phone_e164), campaign:campaigns(name), agent:profiles!warm_leads_created_by_fkey(full_name), screener:profiles!warm_leads_assigned_screener_id_fkey(id, full_name)",
    )
    .order("created_at", { ascending: false })
    .limit(500);

  const rows: WarmLeadTableRow[] = (warmLeads ?? []).map((w) => ({
    id: w.id,
    leadId: w.lead_id,
    leadName: [w.lead?.first_name, w.lead?.last_name].filter(Boolean).join(" ") || w.lead?.company_name || "—",
    companyName: w.lead?.company_name ?? null,
    phone: w.lead?.phone_e164 ?? "—",
    campaignName: w.campaign?.name ?? "—",
    agentName: w.agent?.full_name ?? "—",
    screenerName: w.screener?.full_name ?? null,
    screenerId: w.screener?.id ?? null,
    status: w.status,
    dispositionCode: w.disposition_code,
    agentNotes: w.agent_notes,
    screenerNotes: w.screener_notes,
    createdAt: w.created_at,
  }));

  return (
    <div className="p-4">
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-ink">Warm leads</h2>
        <p className="text-xs text-muted">
          {rows.length} lead{rows.length === 1 ? "" : "s"} an agent marked interested — screen them to
          converted, back for follow-up, or lost.
        </p>
      </div>

      <WarmLeadsTable rows={rows} currentUserId={user.id} />
    </div>
  );
}
