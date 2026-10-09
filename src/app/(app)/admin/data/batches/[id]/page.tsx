import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ChevronLeft, FileSpreadsheet, PhoneCall, Inbox, Ban } from "lucide-react";
import { requireProfile } from "@/lib/auth/current-profile";
import { getBatchDetail } from "@/lib/reports/batch-detail";
import { StatTile } from "@/components/ui/stat-tile";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

const STATUS_BADGE: Record<string, "neutral" | "warning" | "confirm" | "danger"> = {
  uploaded: "warning",
  mapping: "warning",
  validating: "warning",
  screening: "warning",
  complete: "confirm",
  failed: "danger",
};

export default async function BatchDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const profile = await requireProfile();
  if (!["super_admin", "ops_manager"].includes(profile.role)) redirect("/");

  const { id } = await params;
  const detail = await getBatchDetail(id);
  if (!detail) notFound();

  const { summary, dispositionBreakdown, leads } = detail;
  const dialed = leads.filter((l) => l.attemptCount > 0).length;
  const remaining = leads.filter((l) => l.attemptCount === 0 && !l.doNotCall).length;

  return (
    <div className="p-4">
      <Link
        href="/admin/data"
        className="mb-3 inline-flex items-center gap-1 text-xs text-muted hover:text-ink"
      >
        <ChevronLeft className="h-3.5 w-3.5" /> Back to Data
      </Link>

      <div className="mb-4 flex flex-wrap items-start justify-between gap-2">
        <div>
          <h2 className="text-lg font-semibold text-ink">{summary.originalFilename ?? "Upload batch"}</h2>
          <p className="text-xs text-muted">
            {summary.campaignName ?? "—"} · {summary.dataSourceName ?? "—"} · uploaded by{" "}
            {summary.uploaderName ?? "—"}
            {summary.acquiredAt && <> on {new Date(summary.acquiredAt).toLocaleString()}</>}
          </p>
        </div>
        <Badge variant={STATUS_BADGE[summary.status] ?? "neutral"}>{summary.status}</Badge>
      </div>

      <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatTile icon={FileSpreadsheet} value={summary.rowsTotal} label="Total numbers uploaded" accent="blue" />
        <StatTile icon={PhoneCall} value={dialed} label="Dialed" accent="orange" />
        <StatTile icon={Inbox} value={remaining} label="Remaining (not yet dialed)" accent="green" />
        <StatTile
          icon={Ban}
          value={summary.rowsRejected + summary.rowsDuplicate + summary.rowsSuppressed}
          label={`Rejected/duplicate/suppressed (${summary.rowsRejected}/${summary.rowsDuplicate}/${summary.rowsSuppressed})`}
          accent="orange"
        />
      </div>

      <Card className="mb-4 animate-slide-up">
        <CardHeader>
          <CardTitle>Result breakdown (dialed numbers only)</CardTitle>
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
              {dispositionBreakdown.map((b) => (
                <tr key={b.label} className="h-[38px] border-b border-line last:border-0">
                  <td className="px-4 py-1.5 font-medium text-ink">{b.label}</td>
                  <td className="px-4 py-1.5 tabular text-muted">{b.count}</td>
                  <td className="px-4 py-1.5 tabular text-muted">{b.pct}%</td>
                </tr>
              ))}
              {dispositionBreakdown.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-4 py-8 text-center text-sm text-muted">
                    Nothing from this batch has been dialed yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <Card className="animate-slide-up">
        <CardHeader>
          <CardTitle>Every number in this batch ({leads.length})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="max-h-[600px] overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-canvas">
                <tr className="border-b border-line text-left text-xs text-muted">
                  <th className="px-4 py-2 font-medium">Name</th>
                  <th className="px-4 py-2 font-medium">Phone</th>
                  <th className="px-4 py-2 font-medium">Status</th>
                  <th className="px-4 py-2 font-medium">Attempts</th>
                  <th className="px-4 py-2 font-medium">Result</th>
                  <th className="px-4 py-2 font-medium">Last dialed</th>
                </tr>
              </thead>
              <tbody>
                {leads.map((l) => (
                  <tr key={l.id} className="h-[38px] border-b border-line last:border-0">
                    <td className="px-4 py-1.5 font-medium text-ink">{l.name}</td>
                    <td className="px-4 py-1.5 tabular">{l.phone}</td>
                    <td className="px-4 py-1.5">
                      {l.doNotCall ? (
                        <Badge variant="danger">Suppressed</Badge>
                      ) : (
                        <Badge variant="neutral">{l.status.replace(/_/g, " ")}</Badge>
                      )}
                    </td>
                    <td className="px-4 py-1.5 tabular text-muted">{l.attemptCount}</td>
                    <td className="px-4 py-1.5">
                      {l.lastDispositionLabel ? (
                        <Badge variant="warning">{l.lastDispositionLabel}</Badge>
                      ) : (
                        <span className="text-muted">—</span>
                      )}
                    </td>
                    <td className="px-4 py-1.5 tabular text-xs text-muted">
                      {l.lastAttemptAt ? new Date(l.lastAttemptAt).toLocaleString() : "—"}
                    </td>
                  </tr>
                ))}
                {leads.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-sm text-muted">
                      No accepted numbers from this upload — every row was rejected, a duplicate,
                      or suppressed.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
