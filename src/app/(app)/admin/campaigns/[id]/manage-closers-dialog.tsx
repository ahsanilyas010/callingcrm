"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Handshake, X } from "lucide-react";
import { assignCloserToCampaign, removeCloserFromCampaign } from "@/lib/actions/appointments";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

interface CloserRow {
  id: string;
  name: string;
}

// Literal clone of ManageAgentsDialog, backed by campaign_closers instead of
// campaign_assignments — see that file for the reasoning behind the pattern.
export function ManageClosersDialog({
  campaignId,
  assigned,
  roster,
}: {
  campaignId: string;
  assigned: CloserRow[];
  roster: { id: string; full_name: string }[];
}) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [userId, setUserId] = useState("");
  const router = useRouter();

  const assignedIds = new Set(assigned.map((a) => a.id));
  const available = roster.filter((r) => !assignedIds.has(r.id));

  function add() {
    if (!userId) {
      toast.error("Pick a closer first.");
      return;
    }
    startTransition(async () => {
      const result = await assignCloserToCampaign(campaignId, userId);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Closer added to the roster");
        setUserId("");
        router.refresh();
      }
    });
  }

  function remove(closerId: string) {
    startTransition(async () => {
      const result = await removeCloserFromCampaign(campaignId, closerId);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Removed from the roster");
        router.refresh();
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button variant="secondary" size="sm" onClick={() => setOpen(true)}>
        <Handshake className="h-3.5 w-3.5" /> Manage closers
      </Button>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Manage closers</DialogTitle>
          <DialogDescription>
            When an agent logs an &ldquo;Appointment set&rdquo; disposition on this campaign, it&rsquo;s
            routed to whichever closer here currently has the fewest open appointments.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-2">
          {assigned.length === 0 && (
            <p className="rounded-md border border-dashed border-line px-3 py-4 text-center text-xs text-muted">
              No closers on this roster yet — appointments booked on this campaign won&rsquo;t be
              assigned to anyone until at least one is added below.
            </p>
          )}
          {assigned.map((a) => (
            <div
              key={a.id}
              className="flex items-center justify-between rounded-md border border-line px-3 py-2"
            >
              <div className="text-sm font-medium text-ink">{a.name}</div>
              <Button
                variant="ghost"
                size="icon"
                disabled={pending}
                onClick={() => remove(a.id)}
                aria-label={`Remove ${a.name}`}
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>
          ))}
        </div>

        <div className="mt-3 flex items-end gap-2 border-t border-line pt-3">
          <div className="flex flex-1 flex-col gap-1.5">
            <Label>Add closer</Label>
            <Select value={userId} onValueChange={setUserId}>
              <SelectTrigger>
                <SelectValue placeholder={available.length === 0 ? "No more staff to add" : "Pick a closer"} />
              </SelectTrigger>
              <SelectContent>
                {available.map((r) => (
                  <SelectItem key={r.id} value={r.id}>
                    {r.full_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button onClick={add} disabled={pending || !userId}>
            {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Add"}
          </Button>
        </div>

        <DialogFooter>
          <Button type="button" variant="secondary" onClick={() => setOpen(false)}>
            Done
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
