import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth/current-profile";
import { redirect } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LeaveDecisionButtons } from "./leave-decision-buttons";
import { CreateShiftDialog } from "./create-shift-dialog";
import { AssignShiftDialog } from "./assign-shift-dialog";
import { CampaignRosterPanel } from "./campaign-roster-panel";
import { AttendanceTabsRoot } from "./attendance-tabs";
import { DateNav, DateRangeNav } from "./date-nav";

const STATUS_BADGE: Record<string, React.ComponentProps<typeof Badge>["variant"]> = {
  present: "confirm",
  late: "warning",
  absent: "danger",
  half_day: "warning",
  on_leave: "blue",
  holiday: "neutral",
  week_off: "neutral",
  wfh: "blue",
};

export default async function AttendancePage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string; from?: string; to?: string }>;
}) {
  const profile = await requireProfile();
  if (!["super_admin", "ops_manager", "team_lead"].includes(profile.role)) redirect("/");

  const supabase = await createClient();
  const today = new Date().toISOString().slice(0, 10);
  const { date: dateParam, from: fromParam, to: toParam } = await searchParams;
  const musterDate = dateParam ?? today;
  const historyTo = toParam ?? today;
  const historyFrom = fromParam ?? new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

  const [{ data: sessions }, { data: leaveRequests }, { data: shifts }, { data: people }, { data: campaigns }, { data: history }] =
    await Promise.all([
      supabase
        .from("attendance_sessions")
        .select("*, profiles!attendance_sessions_user_id_fkey(full_name, agent_code)")
        .eq("work_date", musterDate)
        .order("clock_in_at", { ascending: true, nullsFirst: false }),
      supabase
        .from("leave_requests")
        .select("*, profiles!leave_requests_user_id_fkey(full_name)")
        .order("created_at", { ascending: false })
        .limit(50),
      supabase.from("shifts").select("*").order("name"),
      supabase.from("profiles").select("id, full_name, role").eq("is_active", true).order("full_name"),
      supabase.from("campaigns").select("id, name, code").order("name"),
      supabase
        .from("attendance_sessions")
        .select("*, profiles!attendance_sessions_user_id_fkey(full_name, agent_code)")
        .gte("work_date", historyFrom)
        .lte("work_date", historyTo)
        .order("work_date", { ascending: false })
        .limit(1000),
    ]);

  const pendingLeave = (leaveRequests ?? []).filter((l) => l.status === "pending");
  const canApprove = ["super_admin", "ops_manager", "team_lead"].includes(profile.role);
  const canManageShifts = ["super_admin", "ops_manager"].includes(profile.role);

  return (
    <div className="p-4">
      <AttendanceTabsRoot defaultValue="muster">
        <TabsList className="mb-4">
          <TabsTrigger value="muster">Daily muster</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
          <TabsTrigger value="leave">
            Leave requests
            {pendingLeave.length > 0 && (
              <Badge variant="warning" className="ml-1.5">
                {pendingLeave.length}
              </Badge>
            )}
          </TabsTrigger>
          {canManageShifts && <TabsTrigger value="shifts">Shifts</TabsTrigger>}
        </TabsList>

        <TabsContent value="muster">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-xs text-muted">
              {musterDate} · {(sessions ?? []).length} clocked in
            </p>
            <DateNav date={musterDate} />
          </div>
          <div className="overflow-hidden rounded-lg border border-line bg-white">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line bg-canvas text-left text-xs text-muted">
                  <th className="px-3 py-2 font-medium">Name</th>
                  <th className="px-3 py-2 font-medium">Status</th>
                  <th className="px-3 py-2 font-medium">Clock in</th>
                  <th className="px-3 py-2 font-medium">Clock out</th>
                  <th className="px-3 py-2 font-medium">Late</th>
                  <th className="px-3 py-2 font-medium">Worked</th>
                </tr>
              </thead>
              <tbody>
                {(sessions ?? []).map((s) => (
                  <tr key={s.id} className="h-[38px] border-b border-line last:border-0">
                    <td className="px-3 py-1.5 font-medium text-ink">
                      {(s as { profiles?: { full_name: string } | null }).profiles?.full_name}
                    </td>
                    <td className="px-3 py-1.5">
                      <Badge variant={STATUS_BADGE[s.status ?? ""] ?? "neutral"}>
                        {(s.status ?? "—").replace(/_/g, " ")}
                      </Badge>
                    </td>
                    <td className="px-3 py-1.5 tabular text-muted">
                      {s.clock_in_at ? new Date(s.clock_in_at).toLocaleTimeString() : "—"}
                    </td>
                    <td className="px-3 py-1.5 tabular text-muted">
                      {s.clock_out_at ? new Date(s.clock_out_at).toLocaleTimeString() : "—"}
                    </td>
                    <td className="px-3 py-1.5 tabular text-muted">
                      {s.late_minutes > 0 ? `${s.late_minutes}m` : "—"}
                    </td>
                    <td className="px-3 py-1.5 tabular text-muted">
                      {s.worked_minutes > 0 ? `${Math.round(s.worked_minutes / 60)}h ${s.worked_minutes % 60}m` : "—"}
                    </td>
                  </tr>
                ))}
                {(sessions ?? []).length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-3 py-8 text-center text-sm text-muted">
                      No one clocked in on this day.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </TabsContent>

        <TabsContent value="history">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-xs text-muted">
              {historyFrom} → {historyTo} · {(history ?? []).length} session{(history ?? []).length === 1 ? "" : "s"}
            </p>
            <DateRangeNav from={historyFrom} to={historyTo} />
          </div>
          <div className="overflow-hidden rounded-lg border border-line bg-white">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line bg-canvas text-left text-xs text-muted">
                  <th className="px-3 py-2 font-medium">Date</th>
                  <th className="px-3 py-2 font-medium">Name</th>
                  <th className="px-3 py-2 font-medium">Status</th>
                  <th className="px-3 py-2 font-medium">Clock in</th>
                  <th className="px-3 py-2 font-medium">Clock out</th>
                  <th className="px-3 py-2 font-medium">Late</th>
                  <th className="px-3 py-2 font-medium">Worked</th>
                </tr>
              </thead>
              <tbody>
                {(history ?? []).map((s) => (
                  <tr key={s.id} className="h-[38px] border-b border-line last:border-0">
                    <td className="px-3 py-1.5 tabular text-ink">{s.work_date}</td>
                    <td className="px-3 py-1.5 font-medium text-ink">
                      {(s as { profiles?: { full_name: string } | null }).profiles?.full_name}
                    </td>
                    <td className="px-3 py-1.5">
                      <Badge variant={STATUS_BADGE[s.status ?? ""] ?? "neutral"}>
                        {(s.status ?? "—").replace(/_/g, " ")}
                      </Badge>
                    </td>
                    <td className="px-3 py-1.5 tabular text-muted">
                      {s.clock_in_at ? new Date(s.clock_in_at).toLocaleTimeString() : "—"}
                    </td>
                    <td className="px-3 py-1.5 tabular text-muted">
                      {s.clock_out_at ? new Date(s.clock_out_at).toLocaleTimeString() : "—"}
                    </td>
                    <td className="px-3 py-1.5 tabular text-muted">
                      {s.late_minutes > 0 ? `${s.late_minutes}m` : "—"}
                    </td>
                    <td className="px-3 py-1.5 tabular text-muted">
                      {s.worked_minutes > 0 ? `${Math.round(s.worked_minutes / 60)}h ${s.worked_minutes % 60}m` : "—"}
                    </td>
                  </tr>
                ))}
                {(history ?? []).length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-3 py-8 text-center text-sm text-muted">
                      No attendance sessions in this date range.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </TabsContent>

        <TabsContent value="leave">
          <div className="overflow-hidden rounded-lg border border-line bg-white">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line bg-canvas text-left text-xs text-muted">
                  <th className="px-3 py-2 font-medium">Name</th>
                  <th className="px-3 py-2 font-medium">Type</th>
                  <th className="px-3 py-2 font-medium">Dates</th>
                  <th className="px-3 py-2 font-medium">Reason</th>
                  <th className="px-3 py-2 font-medium">Status</th>
                  {canApprove && <th className="px-3 py-2 font-medium" />}
                </tr>
              </thead>
              <tbody>
                {(leaveRequests ?? []).map((l) => (
                  <tr key={l.id} className="h-[38px] border-b border-line last:border-0">
                    <td className="px-3 py-1.5 font-medium text-ink">
                      {(l as { profiles?: { full_name: string } | null }).profiles?.full_name}
                    </td>
                    <td className="px-3 py-1.5 text-muted">{l.leave_type}</td>
                    <td className="px-3 py-1.5 tabular text-muted">
                      {l.from_date} → {l.to_date}
                    </td>
                    <td className="px-3 py-1.5 text-muted">{l.reason ?? "—"}</td>
                    <td className="px-3 py-1.5">
                      <Badge
                        variant={
                          l.status === "approved" ? "confirm" : l.status === "rejected" ? "danger" : "warning"
                        }
                      >
                        {l.status}
                      </Badge>
                    </td>
                    {canApprove && (
                      <td className="px-3 py-1.5 text-right">
                        {l.status === "pending" && <LeaveDecisionButtons leaveId={l.id} />}
                      </td>
                    )}
                  </tr>
                ))}
                {(leaveRequests ?? []).length === 0 && (
                  <tr>
                    <td colSpan={canApprove ? 6 : 5} className="px-3 py-8 text-center text-sm text-muted">
                      No leave requests yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </TabsContent>

        {canManageShifts && (
          <TabsContent value="shifts">
            <div className="mb-4">
              <CampaignRosterPanel people={people ?? []} campaigns={campaigns ?? []} />
            </div>
            <div className="mb-3 flex justify-end">
              <CreateShiftDialog />
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {(shifts ?? []).map((s) => (
                <Card key={s.id} className="animate-slide-up">
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      {s.name}
                      {s.crosses_midnight && <Badge variant="neutral">Overnight</Badge>}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-xs text-muted">
                    <div className="tabular">
                      {s.start_time.slice(0, 5)}–{s.end_time.slice(0, 5)} {s.timezone}
                    </div>
                    <div>{s.grace_minutes}m grace · {s.break_allowance_minutes}m break allowance</div>
                    <AssignShiftDialog shiftId={s.id} people={people ?? []} />
                  </CardContent>
                </Card>
              ))}
              {(shifts ?? []).length === 0 && (
                <div className="col-span-full rounded-lg border border-dashed border-line bg-white p-10 text-center text-sm text-muted">
                  No shifts yet. Create one above.
                </div>
              )}
            </div>
          </TabsContent>
        )}
      </AttendanceTabsRoot>
    </div>
  );
}
