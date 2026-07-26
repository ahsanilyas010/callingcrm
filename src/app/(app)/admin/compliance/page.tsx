import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth/current-profile";
import { redirect } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AddSuppressionDialog } from "./add-suppression-dialog";

export default async function CompliancePage() {
  const profile = await requireProfile();
  if (!["super_admin", "ops_manager", "qa"].includes(profile.role)) redirect("/");

  const supabase = await createClient();
  const [{ data: entries, count }, { data: screeningCounts }] = await Promise.all([
    supabase
      .from("suppression_list")
      .select("*, profiles(full_name)", { count: "exact" })
      .order("created_at", { ascending: false })
      .limit(50),
    supabase.from("leads").select("screening_status"),
  ]);

  const counts = (screeningCounts ?? []).reduce<Record<string, number>>((acc, l) => {
    acc[l.screening_status] = (acc[l.screening_status] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <div className="p-4">
      <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Card className="animate-slide-up">
          <CardContent className="pt-4">
            <div className="text-2xl font-semibold tabular text-brand-green-text">
              {counts.passed ?? 0}
            </div>
            <div className="text-xs text-muted">Passed screening</div>
          </CardContent>
        </Card>
        <Card className="animate-slide-up">
          <CardContent className="pt-4">
            <div className="text-2xl font-semibold tabular text-warning">
              {counts.expired ?? 0}
            </div>
            <div className="text-xs text-muted">Expired</div>
          </CardContent>
        </Card>
        <Card className="animate-slide-up">
          <CardContent className="pt-4">
            <div className="text-2xl font-semibold tabular text-danger">
              {counts.unscreened ?? 0}
            </div>
            <div className="text-xs text-muted">Unscreened</div>
          </CardContent>
        </Card>
        <Card className="animate-slide-up">
          <CardContent className="pt-4">
            <div className="text-2xl font-semibold tabular text-ink">{count ?? 0}</div>
            <div className="text-xs text-muted">Suppressed numbers</div>
          </CardContent>
        </Card>
      </div>

      <Card className="animate-slide-up">
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <CardTitle>Suppression list</CardTitle>
          <AddSuppressionDialog />
        </CardHeader>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line bg-canvas text-left text-xs text-muted">
                <th className="px-4 py-2 font-medium">Phone</th>
                <th className="px-4 py-2 font-medium">Reason</th>
                <th className="px-4 py-2 font-medium">Added by</th>
                <th className="px-4 py-2 font-medium">Note</th>
                <th className="px-4 py-2 font-medium">Added</th>
              </tr>
            </thead>
            <tbody>
              {(entries ?? []).map((e) => (
                <tr key={e.phone_e164} className="h-[38px] border-b border-line last:border-0">
                  <td className="px-4 py-1.5 tabular font-medium text-ink">{e.phone_e164}</td>
                  <td className="px-4 py-1.5">
                    <Badge variant="danger">{e.reason.replace(/_/g, " ")}</Badge>
                  </td>
                  <td className="px-4 py-1.5 text-muted">
                    {(e as { profiles?: { full_name: string } | null }).profiles?.full_name ??
                      "System"}
                  </td>
                  <td className="px-4 py-1.5 text-muted">{e.evidence_note ?? "—"}</td>
                  <td className="px-4 py-1.5 tabular text-xs text-muted">
                    {new Date(e.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
              {(entries ?? []).length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-sm text-muted">
                    No suppressed numbers yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <p className="mt-3 text-[11px] text-muted">
        Real TPS/CTPS/US DNC bureau screening, the retention/evidence vault, and the
        calling-window violation monitor land in Phase 6/8 once a bureau account exists. What&rsquo;s
        real today: the internal suppression gate, which is unconditional — any signed-in user can
        add a number here, and it blocks that number in <code className="tabular">v_dialable_leads</code>{" "}
        the instant it commits.
      </p>
    </div>
  );
}
