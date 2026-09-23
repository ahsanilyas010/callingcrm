import { redirect } from "next/navigation";
import { PhoneOutgoing, PhoneIncoming, Trophy, Percent } from "lucide-react";
import { requireProfile } from "@/lib/auth/current-profile";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatTile } from "@/components/ui/stat-tile";
import { FunnelChart } from "@/components/charts/funnel-chart";
import { DemoBanner } from "@/components/shell/demo-banner";

// Mirrors admin/performance/page.tsx — every number here is hand-authored.
const DUMMY_TOTALS = { calls: 1842, connects: 612, conversions: 96 };
const DUMMY_CONTACT_RATE = "33%";
const DUMMY_FUNNEL = [
  { stage: "Loaded", value: 3200 },
  { stage: "Screened", value: 2890 },
  { stage: "Dialable", value: 2450 },
  { stage: "Worked", value: 1620 },
  { stage: "Contacted", value: 1180 },
  { stage: "Qualified", value: 340 },
  { stage: "Converted", value: 96 },
];
const DUMMY_LEADERBOARD = [
  { name: "Priya Sharma", calls: 214, connects: 82, conversions: 14, contactRate: "38%", talk: "6h 40m" },
  { name: "Marcus Webb", calls: 198, connects: 71, conversions: 11, contactRate: "36%", talk: "5h 55m" },
  { name: "Sofia Reyes", calls: 176, connects: 64, conversions: 9, contactRate: "36%", talk: "5h 10m" },
];

export default async function DemoPerformancePage() {
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
          <FunnelChart label="Meridian Home Services (MHS-01)" data={DUMMY_FUNNEL} />
        </CardContent>
      </Card>

      <Card className="animate-slide-up">
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
                <th className="px-4 py-2 font-medium">Contact rate</th>
                <th className="px-4 py-2 font-medium">Conversions</th>
                <th className="px-4 py-2 font-medium">Talk time</th>
              </tr>
            </thead>
            <tbody>
              {DUMMY_LEADERBOARD.map((a) => (
                <tr key={a.name} className="h-[38px] border-b border-line last:border-0">
                  <td className="px-4 py-1.5 font-medium text-ink">{a.name}</td>
                  <td className="px-4 py-1.5 tabular text-muted">{a.calls}</td>
                  <td className="px-4 py-1.5 tabular text-muted">{a.connects}</td>
                  <td className="px-4 py-1.5 tabular text-muted">{a.contactRate}</td>
                  <td className="px-4 py-1.5 tabular text-muted">{a.conversions}</td>
                  <td className="px-4 py-1.5 tabular text-muted">{a.talk}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
