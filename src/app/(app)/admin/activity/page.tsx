import { redirect } from "next/navigation";
import { PhoneCall } from "lucide-react";
import { requireProfile } from "@/lib/auth/current-profile";
import { getAgentActivityFilters, getAgentActivityReport } from "@/lib/reports/agent-activity";
import { StatTile } from "@/components/ui/stat-tile";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { DateRangeNav } from "@/app/(app)/admin/attendance/date-nav";
import { ActivityFilters } from "./activity-filters";
import { CallLogSection } from "./call-log-section";

export default async function AgentActivityPage({
  searchParams,
}: {
  searchParams: Promise<{ agent?: string; campaign?: string; from?: string; to?: string }>;
}) {
  const profile = await requireProfile();
  if (!["super_admin", "ops_manager", "team_lead"].includes(profile.role)) redirect("/");

  const sp = await searchParams;
  const today = new Date().toISOString().slice(0, 10);
  const from = sp.from ?? today;
  const to = sp.to ?? today;
  const agentId = sp.agent && sp.agent !== "all" ? sp.agent : null;
  const campaignId = sp.campaign && sp.campaign !== "all" ? sp.campaign : null;

  const [filters, report] = await Promise.all([
    getAgentActivityFilters(),
    getAgentActivityReport({ agentId, campaignId, from, to }),
  ]);

  return (
    <div className="p-4">
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-ink">Agent activity report</h2>
        <p className="text-xs text-muted">
          Every dial for any agent, campaign and date — a team lead sees only their own team&rsquo;s
          agents here, the same as everywhere else.
        </p>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <ActivityFilters
          agents={filters.agents}
          campaigns={filters.campaigns}
          selectedAgent={sp.agent ?? "all"}
          selectedCampaign={sp.campaign ?? "all"}
        />
        <DateRangeNav from={from} to={to} />
      </div>

      {!report.ok ? (
        <div className="rounded-lg border border-line bg-white px-3 py-8 text-center text-sm text-danger">
          {report.error}
        </div>
      ) : (
        <>
          <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatTile icon={PhoneCall} value={report.totalDialed} label="Total numbers dialed" accent="blue" />
          </div>

          <Card className="mb-4 animate-slide-up">
            <CardHeader>
              <CardTitle>Result breakdown</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-line bg-canvas text-left text-xs text-muted">
                    <th className="px-4 py-2 font-medium">Disposition</th>
                    <th className="px-4 py-2 font-medium">Count</th>
                    <th className="px-4 py-2 font-medium">%</th>
                  </tr>
                </thead>
                <tbody>
                  {report.breakdown.map((b) => (
                    <tr key={b.dispositionId ?? "none"} className="h-[38px] border-b border-line last:border-0">
                      <td className="px-4 py-1.5 font-medium text-ink">{b.label}</td>
                      <td className="px-4 py-1.5 tabular text-muted">{b.count}</td>
                      <td className="px-4 py-1.5 tabular text-muted">{b.pct}%</td>
                    </tr>
                  ))}
                  {report.breakdown.length === 0 && (
                    <tr>
                      <td colSpan={3} className="px-4 py-8 text-center text-sm text-muted">
                        No calls in this range.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </CardContent>
          </Card>

          <CallLogSection calls={report.calls} />
        </>
      )}
    </div>
  );
}
