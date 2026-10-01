"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Bell, Clock, Check, AlarmClock, X, Phone, Copy } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { getMyFollowups, snoozeFollowup, completeFollowup, cancelFollowup, type FollowupRow } from "@/lib/actions/followups";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LeadDetailsDialog } from "@/app/(app)/admin/campaigns/[id]/lead-details-dialog";
import { LeadHistoryDialog } from "@/app/(app)/workspace/leads/lead-history-dialog";

export function FollowupTray({ userId, initial }: { userId: string; initial: FollowupRow[] }) {
  const [followups, setFollowups] = useState(initial);
  const router = useRouter();

  async function refresh() {
    setFollowups(await getMyFollowups());
  }

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`followups-${userId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "followups", filter: `assigned_to=eq.${userId}` },
        () => {
          refresh();
        },
      )
      .subscribe();

    const interval = setInterval(refresh, 60_000);
    return () => {
      supabase.removeChannel(channel);
      clearInterval(interval);
    };
  }, [userId]);

  const dueNow = followups.filter((f) => new Date(f.due_at) <= new Date());

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-4 w-4" />
          {dueNow.length > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand-orange px-1 text-[10px] font-semibold text-ink animate-pulse-dot">
              {dueNow.length}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[min(20rem,calc(100vw-1.5rem))] p-0">
        <div className="border-b border-line px-3 py-2 text-xs font-medium text-muted">
          Follow-ups due
        </div>
        <div className="max-h-80 overflow-y-auto">
          {followups.length === 0 && (
            <p className="px-3 py-6 text-center text-xs text-muted">Nothing due. Clear queue.</p>
          )}
          {followups.map((f) => {
            const due = new Date(f.due_at) <= new Date();
            const leadName =
              [f.leads?.first_name, f.leads?.last_name].filter(Boolean).join(" ") ||
              f.leads?.company_name ||
              f.leads?.phone_e164 ||
              "This lead";
            return (
              <div key={f.id} className="flex flex-col gap-1.5 border-b border-line px-3 py-2 last:border-0">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-ink">{leadName}</span>
                  <Badge variant={due ? "accent" : "neutral"}>
                    <Clock className="h-2.5 w-2.5" />
                    {new Date(f.due_at).toLocaleString([], { hour: "2-digit", minute: "2-digit", month: "short", day: "numeric" })}
                  </Badge>
                </div>
                {f.leads?.phone_e164 && (
                  <div className="flex items-center gap-1.5">
                    <a
                      href={`tel:${f.leads.phone_e164.replace(/\s+/g, "")}`}
                      className="tabular flex items-center gap-1 text-xs text-muted hover:text-brand-blue"
                    >
                      <Phone className="h-3 w-3" /> {f.leads.phone_e164}
                    </a>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-5 w-5"
                      onClick={async () => {
                        await navigator.clipboard.writeText(f.leads!.phone_e164);
                        toast.success("Copied");
                      }}
                      aria-label="Copy phone number"
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                )}
                {f.note && <p className="text-[11px] text-muted">{f.note}</p>}
                <div className="flex items-center gap-1.5">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={async () => {
                      const r = await completeFollowup(f.id);
                      if (r.error) toast.error(r.error);
                      else {
                        toast.success("Done");
                        refresh();
                        router.refresh();
                      }
                    }}
                  >
                    <Check className="h-3 w-3" /> Done
                  </Button>
                  {f.snooze_count < 2 && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={async () => {
                        const r = await snoozeFollowup(f.id);
                        if (r.error) toast.error(r.error);
                        else {
                          toast.success("Snoozed 15 min");
                          refresh();
                        }
                      }}
                    >
                      <AlarmClock className="h-3 w-3" /> Snooze
                    </Button>
                  )}
                  <div className="ml-auto flex items-center gap-0.5">
                    <LeadHistoryDialog leadId={f.lead_id} leadName={leadName} />
                    <LeadDetailsDialog
                      leadName={leadName}
                      custom={f.leads?.custom as Record<string, unknown> | null}
                      contact={{
                        email: f.leads?.email ?? null,
                        company_name: f.leads?.company_name ?? null,
                        job_title: f.leads?.job_title ?? null,
                        address_line1: f.leads?.address_line1 ?? null,
                        city: f.leads?.city ?? null,
                        region: f.leads?.region ?? null,
                        postcode: f.leads?.postcode ?? null,
                      }}
                    />
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={async () => {
                        const r = await cancelFollowup(f.id);
                        if (r.error) toast.error(r.error);
                        else {
                          refresh();
                        }
                      }}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
