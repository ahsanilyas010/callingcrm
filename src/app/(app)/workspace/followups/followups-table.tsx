"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Phone, Copy, Check, AlarmClock, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { completeFollowup, snoozeFollowup, cancelFollowup, type FollowupRow } from "@/lib/actions/followups";
import { LeadHistoryDialog } from "@/app/(app)/workspace/leads/lead-history-dialog";
import { LeadWorkspaceDialog } from "@/app/(app)/workspace/leads/lead-workspace-dialog";

const STATUS_FILTERS: { value: string; label: string }[] = [
  { value: "all", label: "All" },
  { value: "pending", label: "Pending" },
  { value: "snoozed", label: "Snoozed" },
  { value: "done", label: "Done" },
  { value: "missed", label: "Missed" },
  { value: "cancelled", label: "Cancelled" },
];

const STATUS_BADGE_VARIANT: Record<string, "neutral" | "blue" | "warning" | "confirm" | "danger"> = {
  pending: "warning",
  snoozed: "neutral",
  done: "confirm",
  missed: "danger",
  cancelled: "neutral",
};

const PRIORITY_BADGE_VARIANT: Record<string, "neutral" | "warning" | "danger"> = {
  low: "neutral",
  normal: "neutral",
  high: "danger",
};

export function FollowupsTable({ rows }: { rows: FollowupRow[] }) {
  const [filter, setFilter] = useState("all");
  const router = useRouter();

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: rows.length };
    for (const r of rows) c[r.status] = (c[r.status] ?? 0) + 1;
    return c;
  }, [rows]);

  const visible = filter === "all" ? rows : rows.filter((r) => r.status === filter);

  async function act(action: (id: string) => Promise<{ error?: string }>, id: string, successMsg: string) {
    const result = await action(id);
    if (result.error) toast.error(result.error);
    else {
      toast.success(successMsg);
      router.refresh();
    }
  }

  return (
    <div>
      <div className="mb-3 flex flex-wrap gap-1.5">
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

      <div className="overflow-x-auto rounded-lg border border-line bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-line bg-canvas text-left text-xs text-muted">
              <th className="px-3 py-2 font-medium">Lead</th>
              <th className="px-3 py-2 font-medium">Phone</th>
              <th className="px-3 py-2 font-medium">Due</th>
              <th className="px-3 py-2 font-medium">Priority</th>
              <th className="px-3 py-2 font-medium">Note</th>
              <th className="px-3 py-2 font-medium">Status</th>
              <th className="px-3 py-2 font-medium" />
            </tr>
          </thead>
          <tbody>
            {visible.map((f) => {
              const leadName =
                [f.leads?.first_name, f.leads?.last_name].filter(Boolean).join(" ") ||
                f.leads?.company_name ||
                f.leads?.phone_e164 ||
                "This lead";
              const actionable = f.status === "pending" || f.status === "snoozed";
              const due = new Date(f.due_at) <= new Date();

              return (
                <tr key={f.id} className="h-[38px] border-b border-line last:border-0">
                  <td className="px-3 py-1.5 font-medium text-ink">
                    {actionable && f.leads ? (
                      <LeadWorkspaceDialog
                        trigger={<span className="cursor-pointer hover:text-brand-blue hover:underline">{leadName}</span>}
                        lead={{
                          id: f.lead_id,
                          campaign_id: f.campaign_id,
                          first_name: f.leads.first_name,
                          last_name: f.leads.last_name,
                          company_name: f.leads.company_name,
                          job_title: f.leads.job_title,
                          phone_e164: f.leads.phone_e164,
                          email: f.leads.email,
                          address_line1: f.leads.address_line1,
                          city: f.leads.city,
                          region: f.leads.region,
                          postcode: f.leads.postcode,
                          custom: f.leads.custom,
                          attempt_count: f.leads.attempt_count,
                          lastCall: null,
                        }}
                      />
                    ) : (
                      leadName
                    )}
                  </td>
                  <td className="px-3 py-1.5">
                    {f.leads?.phone_e164 ? (
                      <div className="flex items-center gap-1">
                        <a
                          href={`tel:${f.leads.phone_e164.replace(/\s+/g, "")}`}
                          className="tabular flex items-center gap-1 text-xs text-ink hover:text-brand-blue"
                        >
                          <Phone className="h-3 w-3" /> {f.leads.phone_e164}
                        </a>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={async () => {
                            await navigator.clipboard.writeText(f.leads!.phone_e164);
                            toast.success("Copied");
                          }}
                          aria-label="Copy phone number"
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="px-3 py-1.5 tabular text-xs">
                    <span className={due && actionable ? "font-medium text-brand-orange-text" : "text-muted"}>
                      {new Date(f.due_at).toLocaleString("en-GB", { dateStyle: "short", timeStyle: "short" })}
                    </span>
                  </td>
                  <td className="px-3 py-1.5">
                    <Badge variant={PRIORITY_BADGE_VARIANT[f.priority] ?? "neutral"}>{f.priority}</Badge>
                  </td>
                  <td className="max-w-[240px] truncate px-3 py-1.5 text-muted" title={f.note ?? undefined}>
                    {f.note ?? "—"}
                  </td>
                  <td className="px-3 py-1.5">
                    <Badge variant={STATUS_BADGE_VARIANT[f.status] ?? "neutral"}>{f.status}</Badge>
                  </td>
                  <td className="px-3 py-1.5">
                    <div className="flex items-center justify-end gap-1">
                      {actionable && (
                        <>
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => act(completeFollowup, f.id, "Done")}
                          >
                            <Check className="h-3 w-3" /> Done
                          </Button>
                          {f.snooze_count < 2 && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => act(snoozeFollowup, f.id, "Snoozed 15 min")}
                            >
                              <AlarmClock className="h-3 w-3" /> Snooze
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => act(cancelFollowup, f.id, "Cancelled")}
                            aria-label="Cancel"
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </>
                      )}
                      <LeadHistoryDialog leadId={f.lead_id} leadName={leadName} />
                    </div>
                  </td>
                </tr>
              );
            })}
            {visible.length === 0 && (
              <tr>
                <td colSpan={7} className="px-3 py-8 text-center text-sm text-muted">
                  No follow-ups match this filter.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
