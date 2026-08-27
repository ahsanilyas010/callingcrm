import { redirect } from "next/navigation";
import { requireProfile } from "@/lib/auth/current-profile";
import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import { priorContact } from "@/lib/leads/prior-contact";
import { LeadDetailsDialog } from "@/app/(app)/admin/campaigns/[id]/lead-details-dialog";
import { EditLeadDialog } from "./edit-lead-dialog";

export default async function MyLeadsPage() {
  const profile = await requireProfile();
  if (profile.role !== "agent") redirect("/");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // RLS (leads_select) already scopes this to leads assigned to the caller
  // — the explicit filter here is just for query efficiency, not security.
  const { data: leads } = await supabase
    .from("leads")
    .select("*")
    .eq("assigned_to", user.id)
    .order("updated_at", { ascending: false })
    .limit(500);

  const rows = leads ?? [];

  return (
    <div className="p-4">
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-ink">My leads</h2>
        <p className="text-xs text-muted">
          {rows.length} lead{rows.length === 1 ? "" : "s"} assigned to you. Edits here save
          straight to the lead — the dial workspace still pulls from the shared campaign queue.
        </p>
      </div>

      <div className="overflow-x-auto rounded-lg border border-line bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-line bg-canvas text-left text-xs text-muted">
              <th className="px-3 py-2 font-medium">Name</th>
              <th className="px-3 py-2 font-medium">Phone</th>
              <th className="px-3 py-2 font-medium">Project</th>
              <th className="px-3 py-2 font-medium">Disposition</th>
              <th className="px-3 py-2 font-medium">Remarks</th>
              <th className="px-3 py-2 font-medium">Status</th>
              <th className="px-3 py-2 font-medium" />
            </tr>
          </thead>
          <tbody>
            {rows.map((l) => {
              const custom = (l.custom as Record<string, unknown> | null) ?? {};
              const { disposition, remarks } = priorContact(l.custom);
              return (
                <tr key={l.id} className="h-[38px] border-b border-line last:border-0">
                  <td className="px-3 py-1.5 font-medium text-ink">
                    {[l.first_name, l.last_name].filter(Boolean).join(" ") || l.company_name || "—"}
                  </td>
                  <td className="px-3 py-1.5 tabular">{l.phone_e164}</td>
                  <td className="max-w-[180px] truncate px-3 py-1.5 text-muted">
                    {typeof custom.project_type === "string" ? custom.project_type : "—"}
                  </td>
                  <td className="px-3 py-1.5">
                    {disposition ? <Badge variant="warning">{disposition}</Badge> : "—"}
                  </td>
                  <td className="max-w-[280px] truncate px-3 py-1.5 text-muted" title={remarks ?? undefined}>
                    {remarks ?? "—"}
                  </td>
                  <td className="px-3 py-1.5">
                    {l.do_not_call ? (
                      <Badge variant="danger">Suppressed</Badge>
                    ) : (
                      <Badge variant="neutral">{l.status.replace(/_/g, " ")}</Badge>
                    )}
                  </td>
                  <td className="px-3 py-1.5">
                    <div className="flex items-center justify-end gap-1">
                      <LeadDetailsDialog
                        leadName={[l.first_name, l.last_name].filter(Boolean).join(" ") || l.phone_e164}
                        custom={l.custom as Record<string, unknown> | null}
                      />
                      <EditLeadDialog lead={l} />
                    </div>
                  </td>
                </tr>
              );
            })}
            {rows.length === 0 && (
              <tr>
                <td colSpan={7} className="px-3 py-8 text-center text-sm text-muted">
                  No leads assigned to you yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
