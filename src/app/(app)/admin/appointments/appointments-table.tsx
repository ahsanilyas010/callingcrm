"use client";

import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { LeadHistoryDialog } from "@/app/(app)/workspace/leads/lead-history-dialog";
import { AppointmentRowActions } from "./appointment-row-actions";
import type { Enums } from "@/lib/supabase/types";

type AppointmentStatus = Enums<"appointment_status">;

const STATUS_FILTERS: { value: AppointmentStatus | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "pending", label: "Pending" },
  { value: "confirmed", label: "Confirmed" },
  { value: "completed", label: "Completed" },
  { value: "follow_up", label: "Follow-up required" },
  { value: "lost", label: "Lost" },
];

const STATUS_BADGE_VARIANT: Record<AppointmentStatus, "neutral" | "blue" | "warning" | "confirm" | "danger"> = {
  pending: "neutral",
  confirmed: "blue",
  completed: "confirm",
  follow_up: "warning",
  lost: "danger",
};

export interface AppointmentTableRow {
  id: string;
  leadId: string;
  leadName: string;
  companyName: string | null;
  phone: string;
  campaignName: string;
  agentName: string;
  closerName: string | null;
  closerId: string | null;
  status: AppointmentStatus;
  scheduledAt: string | null;
  notes: string | null;
  leadConverted: boolean;
}

export function AppointmentsTable({ rows, currentUserId }: { rows: AppointmentTableRow[]; currentUserId: string }) {
  const [filter, setFilter] = useState<AppointmentStatus | "all">("all");
  const [onlyMine, setOnlyMine] = useState(false);

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: rows.length };
    for (const r of rows) c[r.status] = (c[r.status] ?? 0) + 1;
    return c;
  }, [rows]);

  const visible = rows
    .filter((r) => filter === "all" || r.status === filter)
    .filter((r) => !onlyMine || r.closerId === currentUserId);

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap gap-1.5">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.value}
              type="button"
              onClick={() => setFilter(f.value)}
              className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                filter === f.value
                  ? "border-brand-blue bg-brand-blue-tint text-brand-blue"
                  : "border-line bg-white text-muted hover:text-ink"
              }`}
            >
              {f.label} {counts[f.value] ? <span className="tabular">({counts[f.value]})</span> : null}
            </button>
          ))}
        </div>
        <label className="flex items-center gap-1.5 text-xs text-muted">
          <input type="checkbox" checked={onlyMine} onChange={(e) => setOnlyMine(e.target.checked)} />
          Assigned to me
        </label>
      </div>

      <div className="overflow-x-auto rounded-lg border border-line bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-line bg-canvas text-left text-xs text-muted">
              <th className="px-3 py-2 font-medium">Contact</th>
              <th className="px-3 py-2 font-medium">Phone</th>
              <th className="px-3 py-2 font-medium">Campaign</th>
              <th className="px-3 py-2 font-medium">Agent</th>
              <th className="px-3 py-2 font-medium">Closer</th>
              <th className="px-3 py-2 font-medium">Scheduled</th>
              <th className="px-3 py-2 font-medium">Status</th>
              <th className="px-3 py-2 font-medium" />
            </tr>
          </thead>
          <tbody>
            {visible.map((a) => (
              <tr key={a.id} className="h-[38px] border-b border-line last:border-0">
                <td className="px-3 py-1.5 font-medium text-ink">
                  {a.leadName}
                  {a.companyName && <span className="ml-1 text-xs text-muted">· {a.companyName}</span>}
                </td>
                <td className="px-3 py-1.5 tabular">{a.phone}</td>
                <td className="px-3 py-1.5 text-muted">{a.campaignName}</td>
                <td className="px-3 py-1.5 text-muted">{a.agentName}</td>
                <td className="px-3 py-1.5 text-muted">{a.closerName ?? "Unassigned"}</td>
                <td className="px-3 py-1.5 tabular text-muted">
                  {a.scheduledAt
                    ? new Date(a.scheduledAt).toLocaleString("en-GB", { dateStyle: "short", timeStyle: "short" })
                    : "—"}
                </td>
                <td className="px-3 py-1.5">
                  <div className="flex flex-col gap-0.5">
                    <Badge variant={STATUS_BADGE_VARIANT[a.status]}>{a.status.replace(/_/g, " ")}</Badge>
                    {a.leadConverted && <Badge variant="confirm">Converted</Badge>}
                  </div>
                </td>
                <td className="px-3 py-1.5">
                  <div className="flex items-center justify-end gap-1">
                    <LeadHistoryDialog leadId={a.leadId} leadName={a.leadName} />
                    <AppointmentRowActions
                      appointmentId={a.id}
                      leadId={a.leadId}
                      status={a.status}
                      leadConverted={a.leadConverted}
                    />
                  </div>
                </td>
              </tr>
            ))}
            {visible.length === 0 && (
              <tr>
                <td colSpan={8} className="px-3 py-8 text-center text-sm text-muted">
                  No appointments match this filter.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
