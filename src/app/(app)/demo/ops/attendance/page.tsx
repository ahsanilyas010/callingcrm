import { redirect } from "next/navigation";
import { CalendarPlus, Clock } from "lucide-react";
import { requireProfile } from "@/lib/auth/current-profile";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DemoBanner } from "@/components/shell/demo-banner";
import { DemoActionButton } from "../demo-action-button";

// Mirrors admin/attendance/page.tsx — all fabricated.
const MUSTER = [
  { name: "Aiden Brooks", status: "present", clockIn: "8:58 AM", clockOut: "—", late: "—", worked: "3h 40m" },
  { name: "Priya Sharma", status: "present", clockIn: "9:02 AM", clockOut: "—", late: "2m", worked: "3h 36m" },
  { name: "Marcus Webb", status: "late", clockIn: "9:24 AM", clockOut: "—", late: "24m", worked: "3h 14m" },
  { name: "Sofia Reyes", status: "on_leave", clockIn: "—", clockOut: "—", late: "—", worked: "—" },
];
const STATUS_BADGE: Record<string, "confirm" | "warning" | "danger" | "blue" | "neutral"> = {
  present: "confirm",
  late: "warning",
  absent: "danger",
  on_leave: "blue",
};
const LEAVE_REQUESTS = [
  { name: "Sofia Reyes", type: "Annual", dates: "Sep 24 – Sep 26", status: "pending" as const },
  { name: "Lena Ortiz", type: "Sick", dates: "Sep 20", status: "approved" as const },
];
const SHIFTS = [
  { name: "Day shift (US)", start: "14:00", end: "22:00", grace: "10m" },
  { name: "Day shift (UK)", start: "08:00", end: "16:00", grace: "10m" },
];

export default async function DemoAttendancePage() {
  const profile = await requireProfile();
  if (profile.role !== "demo_ops") redirect("/");

  return (
    <div className="p-4">
      <DemoBanner note="Every name, shift, and leave request on this page is sample data — nothing here is real." />

      <Tabs defaultValue="muster">
        <TabsList className="mb-4">
          <TabsTrigger value="muster">Daily muster</TabsTrigger>
          <TabsTrigger value="leave">
            Leave requests
            <Badge variant="warning" className="ml-1.5">
              {LEAVE_REQUESTS.filter((l) => l.status === "pending").length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="shifts">Shifts</TabsTrigger>
        </TabsList>

        <TabsContent value="muster">
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
                {MUSTER.map((s) => (
                  <tr key={s.name} className="h-[38px] border-b border-line last:border-0">
                    <td className="px-3 py-1.5 font-medium text-ink">{s.name}</td>
                    <td className="px-3 py-1.5">
                      <Badge variant={STATUS_BADGE[s.status] ?? "neutral"}>{s.status.replace(/_/g, " ")}</Badge>
                    </td>
                    <td className="px-3 py-1.5 tabular text-muted">{s.clockIn}</td>
                    <td className="px-3 py-1.5 tabular text-muted">{s.clockOut}</td>
                    <td className="px-3 py-1.5 tabular text-muted">{s.late}</td>
                    <td className="px-3 py-1.5 tabular text-muted">{s.worked}</td>
                  </tr>
                ))}
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
                  <th className="px-3 py-2 font-medium">Status</th>
                  <th className="px-3 py-2 font-medium" />
                </tr>
              </thead>
              <tbody>
                {LEAVE_REQUESTS.map((l) => (
                  <tr key={l.name} className="h-[38px] border-b border-line last:border-0">
                    <td className="px-3 py-1.5 font-medium text-ink">{l.name}</td>
                    <td className="px-3 py-1.5 text-muted">{l.type}</td>
                    <td className="px-3 py-1.5 text-muted">{l.dates}</td>
                    <td className="px-3 py-1.5">
                      {l.status === "pending" ? (
                        <Badge variant="warning">Pending</Badge>
                      ) : (
                        <Badge variant="confirm">Approved</Badge>
                      )}
                    </td>
                    <td className="px-3 py-1.5 text-right">
                      {l.status === "pending" && (
                        <div className="flex justify-end gap-1.5">
                          <DemoActionButton size="sm" variant="confirm">Approve</DemoActionButton>
                          <DemoActionButton size="sm" variant="secondary">Reject</DemoActionButton>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </TabsContent>

        <TabsContent value="shifts">
          <div className="mb-4 flex items-center justify-between">
            <p className="text-xs text-muted">{SHIFTS.length} shifts</p>
            <div className="flex gap-2">
              <DemoActionButton variant="secondary" size="sm">
                <CalendarPlus className="h-3.5 w-3.5" /> Assign shift
              </DemoActionButton>
              <DemoActionButton size="sm">
                <Clock className="h-3.5 w-3.5" /> Create shift
              </DemoActionButton>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {SHIFTS.map((s) => (
              <div key={s.name} className="rounded-lg border border-line bg-white p-3">
                <div className="text-sm font-semibold text-ink">{s.name}</div>
                <div className="mt-1 text-xs text-muted tabular">
                  {s.start} – {s.end} · {s.grace} grace
                </div>
              </div>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
