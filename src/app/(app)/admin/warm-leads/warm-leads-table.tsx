"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { Badge } from "@/components/ui/badge";
import { LeadHistoryDialog } from "@/app/(app)/workspace/leads/lead-history-dialog";
import { WarmLeadRowActions } from "./warm-lead-row-actions";
import type { Enums } from "@/lib/supabase/types";

type WarmLeadStatus = Enums<"warm_lead_status">;

const STATUS_FILTERS: { value: WarmLeadStatus | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "pending", label: "Pending" },
  { value: "in_review", label: "In review" },
  { value: "converted", label: "Converted" },
  { value: "follow_up", label: "Follow-up" },
  { value: "lost", label: "Lost" },
];

const STATUS_BADGE_VARIANT: Record<WarmLeadStatus, "neutral" | "blue" | "warning" | "confirm" | "danger"> = {
  pending: "neutral",
  in_review: "blue",
  converted: "confirm",
  follow_up: "warning",
  lost: "danger",
};

export interface WarmLeadTableRow {
  id: string;
  leadId: string;
  leadName: string;
  companyName: string | null;
  phone: string;
  campaignName: string;
  agentName: string;
  screenerName: string | null;
  screenerId: string | null;
  status: WarmLeadStatus;
  dispositionCode: string;
  agentNotes: string | null;
  screenerNotes: string | null;
  createdAt: string;
}

export function WarmLeadsTable({ rows, currentUserId }: { rows: WarmLeadTableRow[]; currentUserId: string }) {
  const [filter, setFilter] = useState<WarmLeadStatus | "all">("all");
  const [onlyMine, setOnlyMine] = useState(false);
  const router = useRouter();

  // Live dashboard: a new warm lead (or a status change from another
  // screener/manager) shows up without a manual refresh — same pattern as
  // the follow-up tray's realtime subscription.
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`warm-leads-${currentUserId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "warm_leads" },
        (payload) => {
          if (payload.eventType === "INSERT") toast.info("A new warm lead just came in");
          router.refresh();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUserId, router]);

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: rows.length };
    for (const r of rows) c[r.status] = (c[r.status] ?? 0) + 1;
    return c;
  }, [rows]);

  const visible = rows
    .filter((r) => filter === "all" || r.status === filter)
    .filter((r) => !onlyMine || r.screenerId === currentUserId);

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
              <th className="px-3 py-2 font-medium">Screener</th>
              <th className="px-3 py-2 font-medium">Routed from</th>
              <th className="px-3 py-2 font-medium">Notes</th>
              <th className="px-3 py-2 font-medium">Status</th>
              <th className="px-3 py-2 font-medium" />
            </tr>
          </thead>
          <tbody>
            {visible.map((w) => (
              <tr key={w.id} className="h-[38px] border-b border-line last:border-0">
                <td className="px-3 py-1.5 font-medium text-ink">
                  {w.leadName}
                  {w.companyName && <span className="ml-1 text-xs text-muted">· {w.companyName}</span>}
                </td>
                <td className="px-3 py-1.5 tabular">{w.phone}</td>
                <td className="px-3 py-1.5 text-muted">{w.campaignName}</td>
                <td className="px-3 py-1.5 text-muted">{w.agentName}</td>
                <td className="px-3 py-1.5 text-muted">{w.screenerName ?? "Unassigned"}</td>
                <td className="px-3 py-1.5">
                  <Badge variant="neutral">{w.dispositionCode.replace(/_/g, " ")}</Badge>
                </td>
                <td
                  className="max-w-[200px] truncate px-3 py-1.5 text-muted"
                  title={[w.agentNotes, w.screenerNotes].filter(Boolean).join(" · ") || undefined}
                >
                  {w.agentNotes ?? "—"}
                </td>
                <td className="px-3 py-1.5">
                  <Badge variant={STATUS_BADGE_VARIANT[w.status]}>{w.status.replace(/_/g, " ")}</Badge>
                </td>
                <td className="px-3 py-1.5">
                  <div className="flex items-center justify-end gap-1">
                    <LeadHistoryDialog leadId={w.leadId} leadName={w.leadName} />
                    <WarmLeadRowActions warmLeadId={w.id} leadId={w.leadId} status={w.status} />
                  </div>
                </td>
              </tr>
            ))}
            {visible.length === 0 && (
              <tr>
                <td colSpan={9} className="px-3 py-8 text-center text-sm text-muted">
                  No warm leads match this filter.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
