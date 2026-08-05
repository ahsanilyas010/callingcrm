import { Building2, Download, ShieldCheck } from "lucide-react";
import { redirect } from "next/navigation";
import { requireProfile } from "@/lib/auth/current-profile";
import { createClient } from "@/lib/supabase/server";
import { loadClientFunnel } from "@/lib/reports/client-funnel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FunnelChart } from "@/components/charts/funnel-chart";
import { ClientSelector } from "./client-selector";

const CATEGORY_BADGE: Record<string, React.ComponentProps<typeof Badge>["variant"]> = {
  connected_positive: "confirm",
  connected_neutral: "blue",
  connected_negative: "warning",
  no_contact: "neutral",
  invalid: "neutral",
  compliance: "danger",
};

const CATEGORY_LABEL: Record<string, string> = {
  connected_positive: "Positive",
  connected_neutral: "Neutral",
  connected_negative: "Negative",
  no_contact: "No contact",
  invalid: "Invalid",
  compliance: "Compliance",
};

export default async function ClientReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ client?: string }>;
}) {
  // Section 6.6: aggregate-only dashboards for client stakeholders — never
  // a lead list, never agent names. That's enforced by role at the
  // database layer (see get_client_funnel in migration 27), not just by
  // what this page chooses to render.
  const profile = await requireProfile();
  if (!["client_viewer", "super_admin", "ops_manager"].includes(profile.role)) redirect("/");

  const isManager = profile.role === "super_admin" || profile.role === "ops_manager";
  const { client: clientIdParam } = await searchParams;

  const supabase = await createClient();
  const [outcome, { data: clients }] = await Promise.all([
    loadClientFunnel(isManager ? (clientIdParam ?? null) : null),
    isManager
      ? supabase.from("clients").select("id, name").order("name")
      : Promise.resolve({ data: [] as { id: string; name: string }[] }),
  ]);

  if (!outcome.ok) {
    return (
      <div className="p-4">
        <Card className="animate-slide-up">
          <CardContent className="py-8 text-center text-sm text-danger">{outcome.error}</CardContent>
        </Card>
      </div>
    );
  }

  const { clientName, rows, dispositions } = outcome.result;
  const totalAttempts = dispositions.reduce((sum, d) => sum + d.attempts, 0);
  const distinctCampaigns = new Set(dispositions.map((d) => d.campaign_id)).size;
  const totals = rows.reduce(
    (acc, r) => ({
      loaded: acc.loaded + r.loaded,
      dialable: acc.dialable + r.dialable,
      contacted: acc.contacted + r.contacted,
      qualified: acc.qualified + r.qualified,
      converted: acc.converted + r.converted,
    }),
    { loaded: 0, dialable: 0, contacted: 0, qualified: 0, converted: 0 },
  );
  const conversionRate = totals.loaded > 0 ? `${Math.round((totals.converted / totals.loaded) * 100)}%` : "—";
  const pdfHref = isManager && clientIdParam ? `/api/client-report?client=${clientIdParam}` : "/api/client-report";

  return (
    <div className="p-4">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-semibold text-ink">
            <Building2 className="h-5 w-5 text-brand-blue" /> Client reports
          </h2>
          <p className="text-xs text-muted">{clientName}</p>
        </div>
        <div className="flex items-center gap-2">
          {isManager && <ClientSelector clients={clients ?? []} current={clientIdParam ?? "all"} />}
          <Button asChild variant="secondary" size="sm">
            <a href={pdfHref}>
              <Download className="h-3.5 w-3.5" /> Download PDF
            </a>
          </Button>
        </div>
      </div>

      <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Card className="animate-slide-up">
          <CardContent className="pt-4">
            <div className="text-2xl font-semibold tabular text-ink">{totals.loaded}</div>
            <div className="text-xs text-muted">Leads loaded</div>
          </CardContent>
        </Card>
        <Card className="animate-slide-up">
          <CardContent className="pt-4">
            <div className="text-2xl font-semibold tabular text-ink">{totals.contacted}</div>
            <div className="text-xs text-muted">Contacted</div>
          </CardContent>
        </Card>
        <Card className="animate-slide-up">
          <CardContent className="pt-4">
            <div className="text-2xl font-semibold tabular text-brand-green-text">{totals.converted}</div>
            <div className="text-xs text-muted">Converted</div>
          </CardContent>
        </Card>
        <Card className="animate-slide-up">
          <CardContent className="pt-4">
            <div className="text-2xl font-semibold tabular text-ink">{conversionRate}</div>
            <div className="text-xs text-muted">Conversion rate</div>
          </CardContent>
        </Card>
      </div>

      <Card className="animate-slide-up">
        <CardHeader>
          <CardTitle>Campaign funnel</CardTitle>
        </CardHeader>
        <CardContent>
          {rows.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted">
              No campaigns loaded for this client yet.
            </p>
          ) : (
            <div className="flex flex-col gap-6">
              {rows.map((r) => (
                <FunnelChart
                  key={r.campaign_id}
                  label={`${r.campaign_name} (${r.campaign_code})`}
                  data={[
                    { stage: "Loaded", value: r.loaded },
                    { stage: "Dialable", value: r.dialable },
                    { stage: "Contacted", value: r.contacted },
                    { stage: "Qualified", value: r.qualified },
                    { stage: "Converted", value: r.converted },
                  ]}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="mt-4 animate-slide-up">
        <CardHeader>
          <CardTitle>Agent responses</CardTitle>
          <p className="text-xs text-muted">
            Every outcome an agent has logged against your leads — {totalAttempts} call attempt
            {totalAttempts === 1 ? "" : "s"} in total. Never a transcript or note, only the
            structured response category.
          </p>
        </CardHeader>
        <CardContent className="p-0">
          {dispositions.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted">No calls logged yet.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line bg-canvas text-left text-xs text-muted">
                  {distinctCampaigns > 1 && <th className="px-4 py-2 font-medium">Campaign</th>}
                  <th className="px-4 py-2 font-medium">Response</th>
                  <th className="px-4 py-2 font-medium">Category</th>
                  <th className="px-4 py-2 font-medium text-right">Attempts</th>
                  <th className="px-4 py-2 font-medium text-right">Share</th>
                </tr>
              </thead>
              <tbody>
                {dispositions.map((d) => (
                  <tr
                    key={`${d.campaign_id}-${d.disposition_code}`}
                    className="h-[38px] border-b border-line last:border-0"
                  >
                    {distinctCampaigns > 1 && (
                      <td className="px-4 py-1.5 text-xs text-muted">{d.campaign_code}</td>
                    )}
                    <td className="px-4 py-1.5 font-medium text-ink">{d.disposition_label}</td>
                    <td className="px-4 py-1.5">
                      <Badge variant={CATEGORY_BADGE[d.category] ?? "neutral"}>
                        {CATEGORY_LABEL[d.category] ?? d.category}
                      </Badge>
                    </td>
                    <td className="px-4 py-1.5 tabular text-right">{d.attempts}</td>
                    <td className="px-4 py-1.5 tabular text-right text-muted">
                      {totalAttempts > 0 ? `${Math.round((d.attempts / totalAttempts) * 100)}%` : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>

      <p className="mt-3 flex items-start gap-1.5 text-[11px] text-muted">
        <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand-green-text" />
        Aggregate counts only — no lead names, phone numbers, emails, or agent identities are ever
        shown here. That is enforced by the database itself (this account has no row-level access
        to individual leads), not just by what this page chooses to display.
      </p>
    </div>
  );
}
