"use client";

import { useState } from "react";
import { History, Loader2 } from "lucide-react";
import { getLeadHistory, type LeadHistoryEvent } from "@/lib/actions/lead-history";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

export function LeadHistoryDialog({ leadId, leadName }: { leadId: string; leadName: string }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [events, setEvents] = useState<LeadHistoryEvent[] | null>(null);

  async function handleOpen() {
    setOpen(true);
    if (events !== null) return;
    setLoading(true);
    const data = await getLeadHistory(leadId);
    setEvents(data);
    setLoading(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button variant="ghost" size="icon" onClick={handleOpen} aria-label={`History for ${leadName}`}>
        <History className="h-3.5 w-3.5" />
      </Button>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{leadName} — history</DialogTitle>
          <DialogDescription>Every call and appointment status change for this lead, newest first.</DialogDescription>
        </DialogHeader>
        <div className="flex max-h-[60vh] flex-col gap-2.5 overflow-y-auto">
          {loading && (
            <div className="flex items-center justify-center py-8 text-muted">
              <Loader2 className="h-4 w-4 animate-spin" />
            </div>
          )}
          {!loading && events?.length === 0 && (
            <p className="py-6 text-center text-sm text-muted">No activity logged for this lead yet.</p>
          )}
          {!loading &&
            events?.map((event) => (
              <div key={`${event.type}-${event.id}`} className="flex flex-col gap-0.5 border-b border-line pb-2 last:border-0">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-ink">{event.label}</span>
                  <span className="text-xs text-muted">
                    {event.at ? new Date(event.at).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" }) : "—"}
                  </span>
                </div>
                {event.note && <span className="text-xs text-muted">{event.note}</span>}
              </div>
            ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
