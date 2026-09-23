import { redirect } from "next/navigation";
import { Radio, UserCheck, PhoneCall, Coffee, MoonStar } from "lucide-react";
import { requireProfile } from "@/lib/auth/current-profile";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatTile } from "@/components/ui/stat-tile";
import { DemoBanner } from "@/components/shell/demo-banner";
import { DUMMY_CAMPAIGNS } from "./dummy-data";

// Mirrors admin/page.tsx (Live floor) — nothing here is queried, all of it
// is hand-authored sample data.
const AUX_COUNTS = { available: 6, on_call: 4, break: 2, away: 1 };

export default async function DemoLiveFloorPage() {
  const profile = await requireProfile();
  if (profile.role !== "demo_ops") redirect("/");

  return (
    <div className="p-4">
      <DemoBanner note="Every number, name, and campaign on this page is sample data — nothing here is real." />

      <Card className="mb-4 animate-slide-up">
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <CardTitle className="flex items-center gap-2">
            <Radio className="h-3.5 w-3.5 animate-pulse-dot text-brand-green-text" /> Live floor
          </CardTitle>
          <span className="text-xs text-muted">13 agents assigned across campaigns</span>
        </CardHeader>
      </Card>

      <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted">Right now</p>
      <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatTile className="stagger-1" icon={UserCheck} value={AUX_COUNTS.available} label="Available" accent="green" />
        <StatTile className="stagger-2" icon={PhoneCall} value={AUX_COUNTS.on_call} label="On call / wrap-up" accent="blue" />
        <StatTile className="stagger-3" icon={Coffee} value={AUX_COUNTS.break} label="On break" accent="orange" />
        <StatTile className="stagger-4" icon={MoonStar} value={AUX_COUNTS.away} label="Idle / offline" accent="blue" />
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {DUMMY_CAMPAIGNS.map((c) => (
          <Card key={c.code} className="hover-lift animate-slide-up">
            <CardHeader className="flex-row items-center justify-between space-y-0">
              <div>
                <CardTitle>{c.name}</CardTitle>
                <p className="tabular text-xs text-muted">{c.code}</p>
              </div>
              {c.isActive ? <Badge variant="confirm">Live</Badge> : <Badge variant="neutral">Not activated</Badge>}
            </CardHeader>
            <div className="flex items-center justify-between px-4 pb-4 text-xs">
              <Badge variant="blue">{c.market}</Badge>
              <span className="text-muted">{c.assignedAgents} agents assigned</span>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
