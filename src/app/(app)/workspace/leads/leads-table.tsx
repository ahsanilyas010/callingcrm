"use client";

import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { priorContact } from "@/lib/leads/prior-contact";
import { LeadDetailsDialog } from "@/app/(app)/admin/campaigns/[id]/lead-details-dialog";
import { EditLeadDialog } from "./edit-lead-dialog";
import { LeadHistoryDialog } from "./lead-history-dialog";

export type PipelineStatus =
  | "contacted"
  | "appointment_booked"
  | "meeting_completed"
  | "follow_up_required"
  | "converted"
  | "other";

const FILTERS: { value: PipelineStatus | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "contacted", label: "Contacted" },
  { value: "appointment_booked", label: "Appointment booked" },
  { value: "meeting_completed", label: "Meeting completed" },
  { value: "follow_up_required", label: "Follow-up required" },
  { value: "converted", label: "Converted" },
];

const APPOINTMENT_BADGE_VARIANT: Record<string, "neutral" | "blue" | "warning" | "confirm" | "danger"> = {
  pending: "neutral",
  confirmed: "blue",
  completed: "confirm",
  follow_up: "warning",
  lost: "danger",
};

export interface LeadTableRow {
  id: string;
  first_name: string | null;
  last_name: string | null;
  company_name: string | null;
  job_title: string | null;
  phone_e164: string;
  phone_raw: string | null;
  email: string | null;
  address_line1: string | null;
  city: string | null;
  region: string | null;
  postcode: string | null;
  custom: unknown;
  status: string;
  do_not_call: boolean;
  // null when the lead's campaign couldn't be joined — shouldn't happen in
  // practice, but a missing campaign shouldn't crash the whole table.
  campaign_code: string | null;
  campaign_name: string | null;
  // Set by "Book callback" at disposition time, independent of the
  // appointments table (which only exists for the appointment_set
  // disposition) — this is the only place a generic scheduled callback is
  // visible at all; previously nothing in this table showed it.
  next_action_at: string | null;
  appointment: { status: string; scheduled_at: string | null } | null;
  lastCall: { dispositionLabel: string; notes: string | null; endedAt: string } | null;
  pipelineStatus: PipelineStatus;
}

export function LeadsTable({ rows }: { rows: LeadTableRow[] }) {
  const [filter, setFilter] = useState<PipelineStatus | "all">("all");
  const [campaignFilter, setCampaignFilter] = useState("all");
  const [callbackOnly, setCallbackOnly] = useState(false);

  const campaigns = useMemo(() => {
    const seen = new Map<string, string>();
    for (const r of rows) {
      if (r.campaign_code) seen.set(r.campaign_code, r.campaign_name ?? r.campaign_code);
    }
    return Array.from(seen, ([code, name]) => ({ code, name }));
  }, [rows]);

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: rows.length };
    for (const r of rows) c[r.pipelineStatus] = (c[r.pipelineStatus] ?? 0) + 1;
    return c;
  }, [rows]);

  const callbackCount = useMemo(() => rows.filter((r) => r.next_action_at).length, [rows]);

  const visible = rows.filter(
    (r) =>
      (filter === "all" || r.pipelineStatus === filter) &&
      (campaignFilter === "all" || r.campaign_code === campaignFilter) &&
      (!callbackOnly || r.next_action_at),
  );

  return (
    <div>
      {campaigns.length > 1 && (
        <div className="mb-2 flex items-center gap-2">
          <span className="text-xs text-muted">Campaign</span>
          <Select value={campaignFilter} onValueChange={setCampaignFilter}>
            <SelectTrigger className="h-7 w-48 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All campaigns</SelectItem>
              {campaigns.map((c) => (
                <SelectItem key={c.code} value={c.code}>
                  {c.code} — {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="mb-3 flex flex-wrap gap-1.5">
        <button
          type="button"
          onClick={() => setCallbackOnly((v) => !v)}
          className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
            callbackOnly
              ? "border-brand-orange bg-brand-orange-tint text-brand-orange-text"
              : "border-line bg-white text-muted hover:text-ink"
          }`}
        >
          Callback scheduled <span className="tabular">({callbackCount})</span>
        </button>
        {FILTERS.map((f) => (
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

      <div className="overflow-x-auto rounded-lg border border-line bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-line bg-canvas text-left text-xs text-muted">
              <th className="px-3 py-2 font-medium">Name</th>
              <th className="px-3 py-2 font-medium">Campaign</th>
              <th className="px-3 py-2 font-medium">Phone</th>
              <th className="px-3 py-2 font-medium">Project</th>
              <th className="px-3 py-2 font-medium">Disposition</th>
              <th className="px-3 py-2 font-medium">Remarks</th>
              <th className="px-3 py-2 font-medium">Status</th>
              <th className="px-3 py-2 font-medium">Callback</th>
              <th className="px-3 py-2 font-medium">Appointment</th>
              <th className="px-3 py-2 font-medium" />
            </tr>
          </thead>
          <tbody>
            {visible.map((l) => {
              const custom = (l.custom as Record<string, unknown> | null) ?? {};
              // A lead's own real call_attempts disposition (if it's ever
              // actually been dialed through this app) takes priority over
              // custom's legacy pre-import fields.
              const legacy = priorContact(l.custom);
              const disposition = l.lastCall?.dispositionLabel ?? legacy.disposition;
              const remarks = l.lastCall ? (l.lastCall.notes ?? legacy.remarks) : legacy.remarks;
              const leadName = [l.first_name, l.last_name].filter(Boolean).join(" ") || l.company_name || "—";
              return (
                <tr key={l.id} className="h-[38px] border-b border-line last:border-0">
                  <td className="px-3 py-1.5 font-medium text-ink">{leadName}</td>
                  <td className="px-3 py-1.5">
                    {l.campaign_code ? <Badge variant="neutral">{l.campaign_code}</Badge> : "—"}
                  </td>
                  <td className="px-3 py-1.5 tabular">{l.phone_e164}</td>
                  <td className="max-w-[180px] truncate px-3 py-1.5 text-muted">
                    {typeof custom.project_type === "string" ? custom.project_type : "—"}
                  </td>
                  <td className="px-3 py-1.5">
                    {disposition ? <Badge variant="warning">{disposition}</Badge> : "—"}
                  </td>
                  <td className="max-w-[220px] truncate px-3 py-1.5 text-muted" title={remarks ?? undefined}>
                    {remarks ?? "—"}
                  </td>
                  <td className="px-3 py-1.5">
                    {l.do_not_call ? (
                      <Badge variant="danger">Suppressed</Badge>
                    ) : (
                      <Badge variant="neutral">{l.status.replace(/_/g, " ")}</Badge>
                    )}
                  </td>
                  <td className="px-3 py-1.5">
                    {l.next_action_at ? (
                      <span
                        className={
                          new Date(l.next_action_at) <= new Date()
                            ? "font-medium text-brand-orange-text"
                            : "text-muted"
                        }
                      >
                        {new Date(l.next_action_at).toLocaleString("en-GB", {
                          dateStyle: "short",
                          timeStyle: "short",
                        })}
                      </span>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="px-3 py-1.5">
                    {l.appointment ? (
                      <div className="flex flex-col gap-0.5">
                        <Badge variant={APPOINTMENT_BADGE_VARIANT[l.appointment.status] ?? "neutral"}>
                          {l.appointment.status.replace(/_/g, " ")}
                        </Badge>
                        {l.appointment.scheduled_at && (
                          <span className="text-[11px] text-muted">
                            {new Date(l.appointment.scheduled_at).toLocaleString("en-GB", {
                              dateStyle: "short",
                              timeStyle: "short",
                            })}
                          </span>
                        )}
                      </div>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="px-3 py-1.5">
                    <div className="flex items-center justify-end gap-1">
                      <LeadHistoryDialog leadId={l.id} leadName={leadName} />
                      <LeadDetailsDialog
                        leadName={leadName}
                        custom={l.custom as Record<string, unknown> | null}
                        contact={{
                          email: l.email,
                          company_name: l.company_name,
                          job_title: l.job_title,
                          address_line1: l.address_line1,
                          city: l.city,
                          region: l.region,
                          postcode: l.postcode,
                        }}
                      />
                      <EditLeadDialog lead={l} />
                    </div>
                  </td>
                </tr>
              );
            })}
            {visible.length === 0 && (
              <tr>
                <td colSpan={10} className="px-3 py-8 text-center text-sm text-muted">
                  No leads match this filter.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
