"use client";

import { useState } from "react";
import { Info } from "lucide-react";
import { CUSTOM_FIELD_LABELS } from "@/lib/lead-custom-fields";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

export function LeadDetailsDialog({
  leadName,
  custom,
}: {
  leadName: string;
  custom: Record<string, unknown> | null;
}) {
  const [open, setOpen] = useState(false);
  const entries = Object.entries(custom ?? {}).filter(([, v]) => v !== null && v !== undefined && v !== "");

  if (entries.length === 0) return null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button variant="ghost" size="icon" onClick={() => setOpen(true)} aria-label={`Details for ${leadName}`}>
        <Info className="h-3.5 w-3.5" />
      </Button>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{leadName}</DialogTitle>
          <DialogDescription>
            Extra context carried over from the source file — not part of the standard contact fields.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-2.5">
          {entries.map(([key, value]) => (
            <div key={key} className="flex flex-col gap-0.5 border-b border-line pb-2 last:border-0">
              <span className="text-[11px] font-medium uppercase tracking-wide text-muted">
                {CUSTOM_FIELD_LABELS[key] ?? key}
              </span>
              <span className="text-sm text-ink">{String(value)}</span>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
