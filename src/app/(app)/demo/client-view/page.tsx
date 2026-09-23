import { redirect } from "next/navigation";
import { Building2, Users, PhoneCall, CheckCircle2, TrendingUp, Clock } from "lucide-react";
import { requireProfile } from "@/lib/auth/current-profile";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatTile } from "@/components/ui/stat-tile";
import { FunnelChart } from "@/components/charts/funnel-chart";
import { DailyActivityChart } from "@/components/charts/daily-activity-chart";
import { DemoBanner } from "@/components/shell/demo-banner";

// Fabricated by hand — this route never queries a real client's data.
const TOTALS = { loaded: 640, contacted: 298, converted: 41 };
const CONVERSION_RATE = "6%";
const FUNNEL = [
  { stage: "Loaded", value: 640 },
  { stage: "Dialable", value: 512 },
  { stage: "Contacted", value: 298 },
  { stage: "Qualified", value: 88 },
  { stage: "Converted", value: 41 },
];
const DISPOSITIONS = [
  { label: "Connected — Interested", category: "Positive", attempts: 88, variant: "confirm" as const },
  { label: "Connected — Callback Requested", category: "Neutral", attempts: 54, variant: "blue" as const },
  { label: "Connected — Not Interested", category: "Negative", attempts: 96, variant: "warning" as const },
  { label: "No Answer", category: "No contact", attempts: 214, variant: "neutral" as const },
  { label: "Voicemail", category: "No contact", attempts: 140, variant: "neutral" as const },
];
const totalAttempts = DISPOSITIONS.reduce((sum, d) => sum + d.attempts, 0);

function fakeDay(offset: number) {
  const d = new Date();
  d.setDate(d.getDate() - offset);
  return d.toISOString().slice(0, 10);
}
const HOURS_PER_DAY = Array.from({ length: 14 }, (_, i) => ({
  day: fakeDay(13 - i),
  value: Math.round((4 + Math.sin(i / 2) * 2 + Math.random() * 1.5) * 10) / 10,
}));
const CALLS_PER_DAY = Array.from({ length: 14 }, (_, i) => ({
  day: fakeDay(13 - i),
  value: Math.round(30 + Math.sin(i / 2) * 10 + Math.random() * 8),
}));

export default async function DemoClientViewPage() {
  const profile = await requireProfile();
  if (profile.role !== "demo_agent") redirect("/");

  return (
    <div className="p-4">
      <DemoBanner note="This is a sample client dashboard — the campaign, numbers, and activity below are all made up." />

      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-ink">
          <Building2 className="h-5 w-5 text-brand-blue" /> Client reports
        </h2>
        <p className="text-xs text-muted">Sample Client Inc.</p>
      </div>

      <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatTile className="stagger-1" icon={Users} value={TOTALS.loaded} label="Leads loaded" accent="blue" />
        <StatTile className="stagger-2" icon={PhoneCall} value={TOTALS.contacted} label="Contacted" accent="orange" />
        <StatTile className="stagger-3" icon={CheckCircle2} value={TOTALS.converted} label="Converted" accent="green" />
        <StatTile className="stagger-4" icon={TrendingUp} value={CONVERSION_RATE} label="Conversion rate" accent="blue" />
      </div>

      <Card className="mb-4 animate-slide-up">
        <CardHeader>
          <CardTitle className="flex items-center gap-1.5">
            <Clock className="h-4 w-4 text-brand-blue" /> Agent activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <DailyActivityChart label="Hours worked per day (last 14 days)" valueLabel="hours" data={HOURS_PER_DAY} />
            <DailyActivityChart label="Calls made per day (last 14 days)" valueLabel="calls" data={CALLS_PER_DAY} />
          </div>
        </CardContent>
      </Card>

      <Card className="mb-4 animate-slide-up">
        <CardHeader>
          <CardTitle>Campaign funnel</CardTitle>
        </CardHeader>
        <CardContent>
          <FunnelChart label="Sample Campaign (DEMO)" data={FUNNEL} />
        </CardContent>
      </Card>

      <Card className="animate-slide-up">
        <CardHeader>
          <CardTitle>Agent responses</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line bg-canvas text-left text-xs text-muted">
                <th className="px-4 py-2 font-medium">Response</th>
                <th className="px-4 py-2 font-medium">Category</th>
                <th className="px-4 py-2 font-medium text-right">Attempts</th>
                <th className="px-4 py-2 font-medium text-right">Share</th>
              </tr>
            </thead>
            <tbody>
              {DISPOSITIONS.map((d) => (
                <tr key={d.label} className="h-[38px] border-b border-line last:border-0">
                  <td className="px-4 py-1.5 font-medium text-ink">{d.label}</td>
                  <td className="px-4 py-1.5">
                    <Badge variant={d.variant}>{d.category}</Badge>
                  </td>
                  <td className="px-4 py-1.5 tabular text-right">{d.attempts}</td>
                  <td className="px-4 py-1.5 tabular text-right text-muted">
                    {Math.round((d.attempts / totalAttempts) * 100)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
