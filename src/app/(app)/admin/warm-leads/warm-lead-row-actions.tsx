"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { updateWarmLeadStatus } from "@/lib/actions/warm-leads";
import { markLeadConverted } from "@/lib/actions/appointments";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Enums } from "@/lib/supabase/types";

type WarmLeadStatus = Enums<"warm_lead_status">;

const STATUS_OPTIONS: { value: WarmLeadStatus; label: string }[] = [
  { value: "pending", label: "Pending" },
  { value: "in_review", label: "In review" },
  { value: "converted", label: "Converted" },
  { value: "follow_up", label: "Follow-up" },
  { value: "lost", label: "Lost" },
];

export function WarmLeadRowActions({
  warmLeadId,
  leadId,
  status,
}: {
  warmLeadId: string;
  leadId: string;
  status: WarmLeadStatus;
}) {
  const [pending, startTransition] = useTransition();
  const [note, setNote] = useState("");
  const router = useRouter();

  function changeStatus(next: WarmLeadStatus) {
    startTransition(async () => {
      const result = await updateWarmLeadStatus(warmLeadId, next, note.trim() || null);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      if (next === "converted") {
        // Keeps leads.status consistent with how the appointments flow
        // already closes out a lead — reused, not duplicated.
        const convertResult = await markLeadConverted(leadId);
        if (convertResult.error) {
          toast.warning(`Marked converted, but couldn't update the lead record: ${convertResult.error}`);
        } else {
          toast.success("Marked converted");
        }
      } else if (next === "follow_up" || next === "lost") {
        toast.success(`Marked ${next.replace(/_/g, " ")} — sent back to the agent's follow-ups`);
      } else {
        toast.success(`Marked ${next.replace(/_/g, " ")}`);
      }
      setNote("");
      router.refresh();
    });
  }

  return (
    <div className="flex items-center justify-end gap-1.5">
      <input
        type="text"
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="Note (optional)"
        className="h-8 w-32 rounded-md border border-line bg-white px-2 text-xs text-ink placeholder:text-muted focus:outline-none focus:ring-1 focus:ring-brand-blue"
      />
      <Select value={status} onValueChange={(v) => changeStatus(v as WarmLeadStatus)} disabled={pending}>
        <SelectTrigger className="h-8 w-[130px] text-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {STATUS_OPTIONS.map((o) => (
            <SelectItem key={o.value} value={o.value}>
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
