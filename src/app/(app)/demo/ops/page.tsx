import { redirect } from "next/navigation";
import { PhoneOutgoing, PhoneIncoming, Trophy, Percent, Radio } from "lucide-react";
import { requireProfile } from "@/lib/auth/current-profile";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatTile } from "@/components/ui/stat-tile";
import { FunnelChart } from "@/components/charts/funnel-chart";
import { DemoBanner } from "@/components/shell/demo-banner";

// Fabricated by hand, not queried — nothing on this page is real data, not
// even the campaign names. This role has no database grants beyond its own
// profile row.
const DUMMY_TOTALS = { calls: 1842, connects: 612, conversions: 96 };
const DUMMY_CONTACT_RATE = "33%";
const DUMMY_FUNNEL = [
  { stage: "Loaded", value: 3200 },
  { stage: "Dialable", value: 2450 },
  { stage: "Contacted", value: 1180 },
  { stage: "Qualified", value: 340 },
  { stage: "Converted", value: 96 },
];
const DUMMY_LEADERBOARD = [
  { name: "J. Alvarez", calls: 214, connects: 82, conversions: 14 },
  { name: "S. Khan", calls: 198, connects: 71, conversions: 11 },
  { name: "M. Chen", calls: 176, connects: 64, conversions: 9 },
];
const DUMMY_CAMPAIGNS = [
  { name: "Meridian Home Services", code: "MHS-01", market: "US", isActive: true },
  { name: "Northgate Insurance Group", code: "NIG-02", market: "UK", isActive: true },
  { name: "Vantage Solar Solutions", code: "VSS-03", market: "US", isActive: false },
];

export default async function DemoOpsPage() {
  const profile = await requireProfile();
  if (profile.role !== "demo_ops") redirect("/");

  return (
    <div className="p-4">
      <DemoBanner note="Every number, name, and campaign on this page is sample data — nothing here is real." />

      <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatTile className="stagger-1" icon={PhoneOutgoing} value={DUMMY_TOTALS.calls} label="Calls attempted — 7d" accent="blue" />
        <StatTile className="stagger-2" icon={PhoneIncoming} value={DUMMY_TOTALS.connects} label="Connects — 7d" accent="orange" />
        <StatTile className="stagger-3" icon={Trophy} value={DUMMY_TOTALS.conversions} label="Conversions — 7d" accent="green" />
        <StatTile className="stagger-4" icon={Percent} value={DUMMY_CONTACT_RATE} label="Contact rate — 7d" accent="blue" />
      </div>

      <Card className="mb-4 animate-slide-up">
        <CardHeader>
          <CardTitle>Campaign funnel</CardTitle>
        </CardHeader>
        <CardContent>
          <FunnelChart label="Sample campaign" data={DUMMY_FUNNEL} />
        </CardContent>
      </Card>

      <Card className="mb-4 animate-slide-up">
        <CardHeader>
          <CardTitle>Agent leaderboard — last 7 days</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line bg-canvas text-left text-xs text-muted">
                <th className="px-4 py-2 font-medium">Agent</th>
                <th className="px-4 py-2 font-medium">Calls attempted</th>
                <th className="px-4 py-2 font-medium">Connects</th>
                <th className="px-4 py-2 font-medium">Conversions</th>
              </tr>
            </thead>
            <tbody>
              {DUMMY_LEADERBOARD.map((a) => (
                <tr key={a.name} className="h-[38px] border-b border-line last:border-0">
                  <td className="px-4 py-1.5 font-medium text-ink">{a.name}</td>
                  <td className="px-4 py-1.5 tabular text-muted">{a.calls}</td>
                  <td className="px-4 py-1.5 tabular text-muted">{a.connects}</td>
                  <td className="px-4 py-1.5 tabular text-muted">{a.conversions}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <Card className="animate-slide-up">
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <CardTitle className="flex items-center gap-2">
            <Radio className="h-3.5 w-3.5 animate-pulse-dot text-brand-green-text" /> Campaigns running now
          </CardTitle>
          <span className="text-xs text-muted">Sample data</span>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {DUMMY_CAMPAIGNS.map((c) => (
              <div key={c.code} className="hover-lift rounded-lg border border-line bg-white p-3">
                <div className="mb-2 flex items-center justify-between">
                  <span className="font-display text-sm font-semibold text-ink">{c.name}</span>
                  {c.isActive ? (
                    <Badge variant="confirm">Live</Badge>
                  ) : (
                    <Badge variant="neutral">Not activated</Badge>
                  )}
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="tabular text-muted">{c.code}</span>
                  <Badge variant="blue">{c.market}</Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
