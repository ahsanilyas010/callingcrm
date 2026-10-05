"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, UserCheck } from "lucide-react";
import { assignUnassignedCampaignLeads } from "@/lib/actions/data-sources";
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

// The recovery path for a batch that landed Unassigned — a missed "Assign
// to" on upload, or a re-upload that got rejected as duplicates and left
// the original rows untouched. Auto-assign round-robins across the whole
// roster toward daily targets; this moves every currently-unassigned lead
// in the campaign onto one chosen agent instead.
export function BulkAssignDialog({
  campaignId,
  roster,
}: {
  campaignId: string;
  roster: { id: string; full_name: string }[];
}) {
  const [open, setOpen] = useState(false);
  const [agentId, setAgentId] = useState("");
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function assign() {
    if (!agentId) {
      toast.error("Pick an agent first.");
      return;
    }
    startTransition(async () => {
      const result = await assignUnassignedCampaignLeads(campaignId, agentId);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success(`Assigned ${result.assigned} lead${result.assigned === 1 ? "" : "s"}`);
        setOpen(false);
        setAgentId("");
        router.refresh();
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button variant="secondary" size="sm" onClick={() => setOpen(true)}>
        <UserCheck className="h-3.5 w-3.5" /> Assign unassigned
      </Button>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Assign unassigned leads</DialogTitle>
          <DialogDescription>
            Moves every currently-unassigned lead in this campaign onto one agent, and marks them
            screened — the same thing &ldquo;Assign to&rdquo; does during upload, for a batch that
            already landed Unassigned. Re-uploading the same file won&rsquo;t fix this: duplicate
            phone numbers are rejected, not updated.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-1.5">
          <Label>Assign to</Label>
          <Select value={agentId} onValueChange={setAgentId}>
            <SelectTrigger>
              <SelectValue placeholder="Pick an agent" />
            </SelectTrigger>
            <SelectContent>
              {roster.map((a) => (
                <SelectItem key={a.id} value={a.id}>
                  {a.full_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <DialogFooter>
          <Button type="button" variant="secondary" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={assign} disabled={pending || !agentId}>
            {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Assign"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
