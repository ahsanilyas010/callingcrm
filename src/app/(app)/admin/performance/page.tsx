import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth/current-profile";
import { redirect } from "next/navigation";
import { PhoneOutgoing, PhoneIncoming, Trophy, Percent, CalendarCheck, CalendarClock, CheckCircle2, Clock3 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FunnelChart } from "@/components/charts/funnel-chart";
import { StatTile } from "@/components/ui/stat-tile";
import { DailyBreakdownCard, type DailyBreakdownRow } from "@/components/reports/daily-breakdown-card";

const APPOINTMENT_DAILY_COLUMNS = [
  { key: "booked", label: "Booked" },
  { key: "confirmed", label: "Confirmed" },
  { key: "completed", label: "Completed" },
  { key: "follow_up", label: "Follow-up" },
];

const CALL_DAILY_COLUMNS = [
  { key: "attempted", label: "Attempted" },
  { key: "connects", label: "Connects" },
];

// Builds one row per day in [from, to] (inclusive), even days with zero
// activity, so the chart's x-axis doesn't silently skip gaps.
function dailyRows(from: string, to: string, counters: Record<string, Record<string, number>>): DailyBreakdownRow[] {
  const rows: DailyBreakdownRow[] = [];
  const cursor = new Date(`${from}T00:00:00.000Z`);
  const end = new Date(`${to}T00:00:00.000Z`);
  while (cursor <= end) {
    const day = cursor.toISOString().slice(0, 10);
    rows.push({ day, ...(counters[day] ?? {}) });
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return rows;
}

export default async function PerformancePage() {
  const profile = await requireProfile();
  if (!["super_admin", "ops_manager", "team_lead"].includes(profile.role)) redirect("/");

  const supabase = await createClient();

  const to = new Date().toISOString().slice(0, 10);
  const from = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

  const [{ data: funnel }, { data: scorecardRows }, { data: campaigns }, { data: appointmentRows }, { data: callRows }, { data: dispositions }] =
    await Promise.all([
      supabase.from("v_campaign_funnel").select("*, campaigns(name, code)"),
      supabase.rpc("get_agent_scorecard", { p_from: from, p_to: to }),
      supabase.from("campaigns").select("id, name, code"),
      supabase.from("appointments").select("status, created_at").gte("created_at", `${from}T00:00:00.000Z`),
      supabase.from("call_attempts").select("started_at, disposition_id").gte("started_at", `${from}T00:00:00.000Z`),
      supabase.from("dispositions").select("id, category"),
    ]);

  const appointmentCounts = {
    booked: (appointmentRows ?? []).filter((a) => a.status === "pending" || a.status === "confirmed").length,
    confirmed: (appointmentRows ?? []).filter((a) => a.status === "confirmed").length,
    completed: (appointmentRows ?? []).filter((a) => a.status === "completed").length,
    followUp: (appointmentRows ?? []).filter((a) => a.status === "follow_up").length,
  };

  const appointmentDailyCounters: Record<string, Record<string, number>> = {};
  for (const a of appointmentRows ?? []) {
    const day = a.created_at.slice(0, 10);
    const bucket = (appointmentDailyCounters[day] ??= { booked: 0, confirmed: 0, completed: 0, follow_up: 0 });
    if (a.status === "pending" || a.status === "confirmed") bucket.booked++;
    if (a.status === "confirmed") bucket.confirmed++;
    if (a.status === "completed") bucket.completed++;
    if (a.status === "follow_up") bucket.follow_up++;
  }
  const appointmentDaily = dailyRows(from, to, appointmentDailyCounters);

  const categoryById = new Map((dispositions ?? []).map((d) => [d.id, d.category]));
  const callDailyCounters: Record<string, Record<string, number>> = {};
  for (const c of callRows ?? []) {
    const day = c.started_at.slice(0, 10);
    const bucket = (callDailyCounters[day] ??= { attempted: 0, connects: 0 });
    bucket.attempted++;
    const category = c.disposition_id ? categoryById.get(c.disposition_id) : null;
    if (typeof category === "string" && category.startsWith("connected")) bucket.connects++;
  }
  const callDaily = dailyRows(from, to, callDailyCounters);

  const campaignNames = new Map((campaigns ?? []).map((c) => [c.id, `${c.name} (${c.code})`]));

  const agentTotals = new Map<
    string,
    { agentId: string; calls: number; connects: number; conversions: number; talkSeconds: number }
  >();
  for (const row of scorecardRows ?? []) {
    if (!row.agent_id) continue;
    const existing = agentTotals.get(row.agent_id) ?? {
      agentId: row.agent_id,
      calls: 0,
      connects: 0,
      conversions: 0,
      talkSeconds: 0,
    };
    existing.calls += row.calls_attempted ?? 0;
    existing.connects += row.connects ?? 0;
    existing.conversions += row.conversions ?? 0;
    existing.talkSeconds += row.talk_seconds ?? 0;
    agentTotals.set(row.agent_id, existing);
  }

  const agentIds = Array.from(agentTotals.keys());
  const { data: agentProfiles } =
    agentIds.length > 0
      ? await supabase.from("profiles").select("id, full_name").in("id", agentIds)
      : { data: [] };
  const nameById = new Map((agentProfiles ?? []).map((p) => [p.id, p.full_name]));

  const leaderboard = Array.from(agentTotals.values())
    .map((a) => ({ ...a, name: nameById.get(a.agentId) ?? "—" }))
    .sort((a, b) => b.calls - a.calls);

  const totals = leaderboard.reduce(
    (acc, a) => ({ calls: acc.calls + a.calls, connects: acc.connects + a.connects, conversions: acc.conversions + a.conversions }),
    { calls: 0, connects: 0, conversions: 0 },
  );
  const contactRate = totals.calls > 0 ? `${Math.round((totals.connects / totals.calls) * 100)}%` : "—";

  return (
    <div className="p-4">
      <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatTile className="stagger-1" icon={PhoneOutgoing} value={totals.calls} label="Calls attempted — 7d" accent="blue" />
        <StatTile className="stagger-2" icon={PhoneIncoming} value={totals.connects} label="Connects — 7d" accent="orange" />
        <StatTile className="stagger-3" icon={Trophy} value={totals.conversions} label="Conversions — 7d" accent="green" />
        <StatTile className="stagger-4" icon={Percent} value={contactRate} label="Contact rate — 7d" accent="blue" />
      </div>

      <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatTile className="stagger-1" icon={CalendarCheck} value={appointmentCounts.booked} label="Appointments booked — 7d" accent="blue" />
        <StatTile className="stagger-2" icon={CalendarClock} value={appointmentCounts.confirmed} label="Confirmed — 7d" accent="orange" />
        <StatTile className="stagger-3" icon={CheckCircle2} value={appointmentCounts.completed} label="Completed — 7d" accent="green" />
        <StatTile className="stagger-4" icon={Clock3} value={appointmentCounts.followUp} label="Follow-up required — 7d" accent="orange" />
      </div>

      <DailyBreakdownCard title="Appointments by day — 7d" rows={appointmentDaily} columns={APPOINTMENT_DAILY_COLUMNS} />
      <DailyBreakdownCard title="Calls by day — 7d" rows={callDaily} columns={CALL_DAILY_COLUMNS} />

      <Card className="mb-4 animate-slide-up">
        <CardHeader>
          <CardTitle>Campaign funnel</CardTitle>
        </CardHeader>
        <CardContent>
          {(funnel ?? []).length === 0 ? (
            <p className="py-6 text-center text-sm text-muted">No leads loaded yet.</p>
          ) : (
            <div className="flex flex-col gap-6">
              {(funnel ?? []).map((f) => (
                <FunnelChart
                  key={f.campaign_id}
                  label={
                    (f as { campaigns?: { name: string; code: string } | null }).campaigns
                      ? `${(f as { campaigns?: { name: string } | null }).campaigns!.name}`
                      : campaignNames.get(f.campaign_id ?? "") ?? "—"
                  }
                  data={[
                    { stage: "Loaded", value: f.loaded ?? 0 },
                    { stage: "Screened", value: f.screened_passed ?? 0 },
                    { stage: "Dialable", value: f.dialable ?? 0 },
                    { stage: "Worked", value: f.worked ?? 0 },
                    { stage: "Contacted", value: f.contacted ?? 0 },
                    { stage: "Qualified", value: f.qualified ?? 0 },
                    { stage: "Converted", value: f.converted ?? 0 },
                  ]}
                />
              ))}
            </div>
          )}
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
              {leaderboard.map((a) => (
                <tr key={a.agentId} className="h-[38px] border-b border-line last:border-0">
                  <td className="px-4 py-1.5 font-medium text-ink">{a.name}</td>
                  <td className="px-4 py-1.5 tabular text-muted">{a.calls}</td>
                  <td className="px-4 py-1.5 tabular text-muted">{a.connects}</td>
                  <td className="px-4 py-1.5 tabular text-muted">
                    {a.calls > 0 ? `${Math.round((a.connects / a.calls) * 100)}%` : "—"}
                  </td>
                  <td className="px-4 py-1.5 tabular text-muted">{a.conversions}</td>
                  <td className="px-4 py-1.5 tabular text-muted">
                    {Math.round(a.talkSeconds / 60)}m
                  </td>
                </tr>
              ))}
              {leaderboard.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-sm text-muted">
                    No calls logged in the last 7 days.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>
      <p className="mt-3 text-[11px] text-muted">
        Agents on different verticals aren&rsquo;t comparable on raw conversion rate — the
        leaderboard defaults to calls attempted and contact rate, which are. Trend charts,
        contact-rate-by-hour heatmap and data-source ROI are Phase 6 follow-ups once there&rsquo;s
        enough call volume to make them meaningful.
      </p>
    </div>
  );
}
