import { redirect } from "next/navigation";
import { ShieldCheck, PhoneOff } from "lucide-react";
import { requireProfile } from "@/lib/auth/current-profile";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatTile } from "@/components/ui/stat-tile";
import { DemoBanner } from "@/components/shell/demo-banner";
import { DemoActionButton } from "../demo-action-button";

// Mirrors admin/compliance/page.tsx — all fabricated.
const COUNTS = { passed: 2140, expired: 86, unscreened: 340, suppressed: 214 };
const SCREENING_RUNS = [
  { campaign: "MHS-01", provider: "TPS", submitted: 620, matched: 18, validUntil: "2026-12-01", ranBy: "Aiden Brooks" },
  { campaign: "NIG-02", provider: "CTPS", submitted: 480, matched: 9, validUntil: "2026-11-15", ranBy: "Aiden Brooks" },
];
const SUPPRESSION_LIST = [
  { phone: "+1 555 019 2231", reason: "verbal dnc", addedBy: "Priya Sharma", note: "Asked not to be called again", added: "2026-09-10" },
  { phone: "+44 7700 900123", reason: "regulatory", addedBy: "System", note: "—", added: "2026-09-05" },
];

export default async function DemoCompliancePage() {
  const profile = await requireProfile();
  if (profile.role !== "demo_ops") redirect("/");

  return (
    <div className="p-4">
      <DemoBanner note="Every number and entry on this page is sample data — nothing here is real." />

      <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatTile className="stagger-1" icon={ShieldCheck} value={COUNTS.passed} label="Passed screening" accent="green" />
        <StatTile className="stagger-2" icon={ShieldCheck} value={COUNTS.expired} label="Expired" accent="orange" />
        <StatTile className="stagger-3" icon={ShieldCheck} value={COUNTS.unscreened} label="Unscreened" accent="orange" />
        <StatTile className="stagger-4" icon={PhoneOff} value={COUNTS.suppressed} label="Suppressed numbers" accent="blue" />
      </div>

      <Card className="mb-4 animate-slide-up">
        <CardContent className="flex items-center justify-between pt-4">
          <div>
            <div className="text-xs font-medium text-ink">Calling-window monitor</div>
            <p className="text-[11px] text-muted">Calls logged outside the lead&rsquo;s permitted local hours.</p>
          </div>
          <Badge variant="confirm">0 — clean</Badge>
        </CardContent>
      </Card>

      <Card className="mb-4 animate-slide-up">
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <CardTitle>Screening runs</CardTitle>
          <DemoActionButton size="sm">Run screening</DemoActionButton>
        </CardHeader>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line bg-canvas text-left text-xs text-muted">
                <th className="px-4 py-2 font-medium">Campaign</th>
                <th className="px-4 py-2 font-medium">Provider</th>
                <th className="px-4 py-2 font-medium">Submitted</th>
                <th className="px-4 py-2 font-medium">Matched</th>
                <th className="px-4 py-2 font-medium">Valid until</th>
                <th className="px-4 py-2 font-medium">Ran by</th>
              </tr>
            </thead>
            <tbody>
              {SCREENING_RUNS.map((r) => (
                <tr key={r.campaign} className="h-[38px] border-b border-line last:border-0">
                  <td className="px-4 py-1.5 text-xs text-muted">{r.campaign}</td>
                  <td className="px-4 py-1.5">
                    <Badge variant="blue">{r.provider}</Badge>
                  </td>
                  <td className="px-4 py-1.5 tabular text-muted">{r.submitted}</td>
                  <td className="px-4 py-1.5 tabular text-muted">{r.matched}</td>
                  <td className="px-4 py-1.5 tabular text-xs text-muted">{r.validUntil}</td>
                  <td className="px-4 py-1.5 text-xs text-muted">{r.ranBy}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <Card className="animate-slide-up">
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <CardTitle>Suppression list</CardTitle>
          <DemoActionButton size="sm">Add number</DemoActionButton>
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
              {SUPPRESSION_LIST.map((e) => (
                <tr key={e.phone} className="h-[38px] border-b border-line last:border-0">
                  <td className="px-4 py-1.5 tabular font-medium text-ink">{e.phone}</td>
                  <td className="px-4 py-1.5">
                    <Badge variant="danger">{e.reason.replace(/_/g, " ")}</Badge>
                  </td>
                  <td className="px-4 py-1.5 text-muted">{e.addedBy}</td>
                  <td className="px-4 py-1.5 text-muted">{e.note}</td>
                  <td className="px-4 py-1.5 tabular text-xs text-muted">{e.added}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
