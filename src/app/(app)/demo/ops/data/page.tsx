import { redirect } from "next/navigation";
import { Database, Plug, Upload } from "lucide-react";
import { requireProfile } from "@/lib/auth/current-profile";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DemoBanner } from "@/components/shell/demo-banner";
import { DemoActionButton } from "../demo-action-button";

// Mirrors admin/data/page.tsx — all fabricated.
const SOURCES = [
  { name: "Meridian vendor list — Sept batch", type: "vendor_licensed", market: "US", active: true },
  { name: "Northgate inbound web form", type: "inbound_web_form", market: "UK", active: true },
  { name: "Vantage referral list", type: "referral", market: "US", active: false },
];
const FETCH_RUNS = [
  { source: "Meridian vendor list — Sept batch", campaign: "MHS-01", triggeredBy: "Aiden Brooks", started: "2026-09-22 09:14", leads: 240 },
  { source: "Northgate inbound web form", campaign: "NIG-02", triggeredBy: "System", started: "2026-09-22 06:00", leads: 18 },
];
const SOURCE_PERFORMANCE = [
  { source: "Meridian vendor list — Sept batch", loaded: 1240, contacted: 640, converted: 58 },
  { source: "Northgate inbound web form", loaded: 410, contacted: 260, converted: 31 },
  { source: "Vantage referral list", loaded: 96, contacted: 40, converted: 3 },
];

export default async function DemoDataPage() {
  const profile = await requireProfile();
  if (profile.role !== "demo_ops") redirect("/");

  return (
    <div className="p-4">
      <DemoBanner note="Every data source and number on this page is sample data — nothing here is real." />

      <Tabs defaultValue="sources">
        <TabsList className="mb-4">
          <TabsTrigger value="sources">Sources</TabsTrigger>
          <TabsTrigger value="history">Fetch history</TabsTrigger>
          <TabsTrigger value="performance">Source performance</TabsTrigger>
        </TabsList>

        <TabsContent value="sources">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs text-muted">{SOURCES.length} sources · every lead traces back to one, with a lawful basis on file</p>
            <div className="flex gap-2">
              <DemoActionButton variant="secondary" size="sm">
                <Plug className="h-3.5 w-3.5" /> Register connector
              </DemoActionButton>
              <DemoActionButton size="sm">
                <Upload className="h-3.5 w-3.5" /> Add source
              </DemoActionButton>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {SOURCES.map((s) => (
              <div key={s.name} className="rounded-lg border border-line bg-white p-3">
                <div className="mb-1 flex items-start justify-between gap-2">
                  <span className="text-sm font-semibold text-ink">{s.name}</span>
                  {s.active ? <Badge variant="confirm">Active</Badge> : <Badge variant="neutral">Inactive</Badge>}
                </div>
                <div className="flex items-center gap-1.5 text-xs text-muted">
                  <Database className="h-3 w-3" /> {s.type.replace(/_/g, " ")} · {s.market}
                </div>
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="history">
          <div className="overflow-hidden rounded-lg border border-line bg-white">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line bg-canvas text-left text-xs text-muted">
                  <th className="px-3 py-2 font-medium">Source</th>
                  <th className="px-3 py-2 font-medium">Campaign</th>
                  <th className="px-3 py-2 font-medium">Triggered by</th>
                  <th className="px-3 py-2 font-medium">Started</th>
                  <th className="px-3 py-2 font-medium">Leads loaded</th>
                </tr>
              </thead>
              <tbody>
                {FETCH_RUNS.map((r) => (
                  <tr key={r.source + r.started} className="h-[38px] border-b border-line last:border-0">
                    <td className="px-3 py-1.5 text-xs text-muted">{r.source}</td>
                    <td className="px-3 py-1.5 tabular text-xs text-muted">{r.campaign}</td>
                    <td className="px-3 py-1.5 text-xs text-muted">{r.triggeredBy}</td>
                    <td className="px-3 py-1.5 tabular text-xs text-muted">{r.started}</td>
                    <td className="px-3 py-1.5 tabular text-muted">{r.leads}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </TabsContent>

        <TabsContent value="performance">
          <div className="overflow-hidden rounded-lg border border-line bg-white">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line bg-canvas text-left text-xs text-muted">
                  <th className="px-3 py-2 font-medium">Source</th>
                  <th className="px-3 py-2 font-medium text-right">Loaded</th>
                  <th className="px-3 py-2 font-medium text-right">Contacted</th>
                  <th className="px-3 py-2 font-medium text-right">Converted</th>
                </tr>
              </thead>
              <tbody>
                {SOURCE_PERFORMANCE.map((s) => (
                  <tr key={s.source} className="h-[38px] border-b border-line last:border-0">
                    <td className="px-3 py-1.5 text-ink">{s.source}</td>
                    <td className="px-3 py-1.5 tabular text-right text-muted">{s.loaded}</td>
                    <td className="px-3 py-1.5 tabular text-right text-muted">{s.contacted}</td>
                    <td className="px-3 py-1.5 tabular text-right text-muted">{s.converted}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
