"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, CheckCircle2 } from "lucide-react";
import { updateAppointmentStatus, markLeadConverted } from "@/lib/actions/appointments";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Enums } from "@/lib/supabase/types";

type AppointmentStatus = Enums<"appointment_status">;

const STATUS_OPTIONS: { value: AppointmentStatus; label: string }[] = [
  { value: "pending", label: "Pending" },
  { value: "confirmed", label: "Confirmed" },
  { value: "completed", label: "Completed" },
  { value: "follow_up", label: "Follow-up" },
  { value: "lost", label: "Lost" },
];

export function AppointmentRowActions({
  appointmentId,
  leadId,
  status,
  leadConverted,
}: {
  appointmentId: string;
  leadId: string;
  status: AppointmentStatus;
  leadConverted: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const [note, setNote] = useState("");
  const router = useRouter();

  function changeStatus(next: AppointmentStatus) {
    startTransition(async () => {
      const result = await updateAppointmentStatus(appointmentId, next, note.trim() || null);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success(`Marked ${next.replace(/_/g, " ")}`);
        setNote("");
        router.refresh();
      }
    });
  }

  function convert() {
    startTransition(async () => {
      const result = await markLeadConverted(leadId);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Lead marked converted");
        router.refresh();
      }
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
      <Select value={status} onValueChange={(v) => changeStatus(v as AppointmentStatus)} disabled={pending}>
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
      {status === "completed" && !leadConverted && (
        <Button variant="secondary" size="icon" disabled={pending} onClick={convert} aria-label="Mark lead converted">
          {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5 text-brand-green-text" />}
        </Button>
      )}
    </div>
  );
}
