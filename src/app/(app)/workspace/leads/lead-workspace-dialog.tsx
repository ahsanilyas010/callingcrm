"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { Copy, Check, Phone, Mail, History, Loader2 } from "lucide-react";
import { priorContact } from "@/lib/leads/prior-contact";
import { CUSTOM_FIELD_LABELS } from "@/lib/lead-custom-fields";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
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
} from "@/components/ui/dialog";
import {
  getDispositions,
  submitCallAttempt,
  type WorkspaceDisposition,
} from "@/lib/actions/workspace";

export interface WorkspaceDialogLead {
  id: string;
  campaign_id: string;
  first_name: string | null;
  last_name: string | null;
  company_name: string | null;
  job_title: string | null;
  phone_e164: string;
  email: string | null;
  address_line1: string | null;
  city: string | null;
  region: string | null;
  postcode: string | null;
  custom: unknown;
  attempt_count: number;
  lastCall: { dispositionLabel: string; notes: string | null; endedAt: string } | null;
}

// Same lead panel + disposition form as the dial workspace (workspace.tsx),
// minus the queue plumbing (no auto-advance, no script pane — this is one
// specific lead the agent picked from My Leads, not the next one up) — so
// clicking a lead here opens the same kind of thing clicking into the dial
// workspace does: full details, and a live disposition form, not just a
// read-only popup.
export function LeadWorkspaceDialog({
  trigger,
  lead,
}: {
  trigger: React.ReactNode;
  lead: WorkspaceDialogLead;
}) {
  const [open, setOpen] = useState(false);
  const [dispositions, setDispositions] = useState<WorkspaceDisposition[] | null>(null);
  const [dispositionId, setDispositionId] = useState("");
  const [notes, setNotes] = useState("");
  const [bookCallback, setBookCallback] = useState(false);
  const [callbackAt, setCallbackAt] = useState("");
  const [copied, setCopied] = useState(false);
  const [emailCopied, setEmailCopied] = useState(false);
  const [pending, setPending] = useState(false);
  const notesRef = useRef<HTMLTextAreaElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (open && dispositions === null) {
      getDispositions(lead.campaign_id).then(setDispositions);
    }
  }, [open, lead.campaign_id, dispositions]);

  useEffect(() => {
    if (!open) {
      setDispositionId("");
      setNotes("");
      setBookCallback(false);
      setCallbackAt("");
    }
  }, [open]);

  const selected = dispositions?.find((d) => d.id === dispositionId);
  const leadName =
    [lead.first_name, lead.last_name].filter(Boolean).join(" ") || lead.company_name || lead.phone_e164;

  const entries = Object.entries((lead.custom as Record<string, unknown> | null) ?? {}).filter(
    ([, v]) => v !== null && v !== undefined && v !== "",
  );

  async function handleSave() {
    if (!selected) {
      toast.error("Select a disposition first.");
      return;
    }
    if (selected.requires_note && !notes.trim()) {
      toast.error("This disposition requires a note.");
      notesRef.current?.focus();
      return;
    }
    if (bookCallback && !callbackAt) {
      toast.error("Set a date and time for the callback.");
      return;
    }

    setPending(true);
    const result = await submitCallAttempt({
      leadId: lead.id,
      campaignId: lead.campaign_id,
      dispositionCode: selected.code,
      notes,
      wrapSeconds: 0,
      callbackAt: bookCallback && callbackAt ? new Date(callbackAt).toISOString() : null,
    });
    setPending(false);

    if (result.error) {
      toast.error(result.error);
      return;
    }
    if (result.suppressed) {
      toast.success(`${lead.phone_e164} suppressed globally — written in the same transaction.`, {
        icon: <Check className="h-4 w-4" />,
      });
    } else {
      toast.success(`Saved — ${selected.label}`);
    }
    if (result.warning) toast.warning(result.warning, { duration: 8000 });

    setOpen(false);
    router.refresh();
  }

  const legacy = priorContact(lead.custom);
  const workedBefore = lead.lastCall
    ? { label: lead.lastCall.dispositionLabel, notes: lead.lastCall.notes, at: lead.lastCall.endedAt }
    : legacy.disposition || legacy.remarks
      ? { label: legacy.disposition, notes: legacy.remarks, at: null }
      : null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <span onClick={() => setOpen(true)} className="cursor-pointer">
        {trigger}
      </span>
      <DialogContent className="max-h-[85vh] max-w-xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {leadName}
            <Badge variant="neutral">Attempt {lead.attempt_count + 1}</Badge>
          </DialogTitle>
          <DialogDescription>
            Same lead panel and disposition form as the dial workspace, for this one lead.
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center gap-2">
          <a
            href={`tel:${lead.phone_e164.replace(/\s+/g, "")}`}
            className="tabular flex items-center gap-1.5 text-lg font-medium text-ink hover:text-brand-blue"
          >
            <Phone className="h-4 w-4" /> {lead.phone_e164}
          </a>
          <Button
            variant="ghost"
            size="icon"
            onClick={async () => {
              await navigator.clipboard.writeText(lead.phone_e164);
              setCopied(true);
              toast.success("Copied");
              setTimeout(() => setCopied(false), 1200);
            }}
          >
            {copied ? <Check className="h-4 w-4 text-brand-green-text" /> : <Copy className="h-4 w-4" />}
          </Button>
        </div>
        {lead.email && (
          <div className="flex items-center gap-2">
            <a
              href={`mailto:${lead.email}`}
              className="flex items-center gap-1.5 text-sm text-muted hover:text-brand-blue"
            >
              <Mail className="h-3.5 w-3.5" /> {lead.email}
            </a>
            <Button
              variant="ghost"
              size="icon"
              onClick={async () => {
                await navigator.clipboard.writeText(lead.email!);
                setEmailCopied(true);
                toast.success("Copied");
                setTimeout(() => setEmailCopied(false), 1200);
              }}
            >
              {emailCopied ? (
                <Check className="h-3.5 w-3.5 text-brand-green-text" />
              ) : (
                <Copy className="h-3.5 w-3.5" />
              )}
            </Button>
          </div>
        )}

        {workedBefore && (workedBefore.label || workedBefore.notes) && (
          <div className="flex flex-col gap-1 rounded-md border border-warning bg-warning-tint px-3 py-2 text-sm text-warning">
            <div className="flex items-center gap-1.5 font-medium">
              <History className="h-4 w-4" /> Worked before
              {workedBefore.label && <Badge variant="warning">{workedBefore.label}</Badge>}
              {workedBefore.at && (
                <span className="ml-auto text-[11px] font-normal opacity-70">
                  {new Date(workedBefore.at).toLocaleString([], { dateStyle: "medium", timeStyle: "short" })}
                </span>
              )}
            </div>
            {workedBefore.notes && <p className="text-xs leading-snug">{workedBefore.notes}</p>}
          </div>
        )}

        <div className="flex flex-col gap-2.5 rounded-md border border-line bg-white p-3 text-sm">
          {(lead.company_name || lead.job_title) && (
            <div className="flex flex-col gap-0.5 border-b border-line pb-2 last:border-0">
              <span className="text-[11px] font-medium uppercase tracking-wide text-muted">Company</span>
              <span className="text-sm text-ink">
                {[lead.company_name, lead.job_title].filter(Boolean).join(" — ")}
              </span>
            </div>
          )}
          {[lead.address_line1, lead.city, lead.region, lead.postcode].some(Boolean) && (
            <div className="flex flex-col gap-0.5 border-b border-line pb-2 last:border-0">
              <span className="text-[11px] font-medium uppercase tracking-wide text-muted">Address</span>
              <span className="text-sm text-ink">
                {[lead.address_line1, lead.city, lead.region, lead.postcode].filter(Boolean).join(", ")}
              </span>
            </div>
          )}
          {entries.map(([key, value]) => (
            <div key={key} className="flex flex-col gap-0.5 border-b border-line pb-2 last:border-0">
              <span className="text-[11px] font-medium uppercase tracking-wide text-muted">
                {CUSTOM_FIELD_LABELS[key] ?? key}
              </span>
              <span className="text-sm text-ink">{String(value)}</span>
            </div>
          ))}
          {!lead.company_name &&
            !lead.job_title &&
            entries.length === 0 &&
            ![lead.address_line1, lead.city, lead.region, lead.postcode].some(Boolean) && (
              <p className="py-1 text-center text-sm text-muted">No additional details on file.</p>
            )}
        </div>

        <div className="flex flex-col gap-3 rounded-md border border-line bg-white p-3">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium uppercase tracking-wide text-muted">Disposition</label>
            {dispositions === null ? (
              <div className="flex items-center gap-2 py-1.5 text-sm text-muted">
                <Loader2 className="h-3.5 w-3.5 animate-spin" /> Loading…
              </div>
            ) : (
              <Select value={dispositionId} onValueChange={setDispositionId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select outcome…" />
                </SelectTrigger>
                <SelectContent>
                  {dispositions.map((d) => (
                    <SelectItem key={d.id} value={d.id}>
                      {d.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium uppercase tracking-wide text-muted">
              Notes
              {selected?.requires_note && <span className="text-danger"> · required</span>}
            </label>
            <Textarea ref={notesRef} value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
          </div>

          <AnimatePresence>
            {selected?.requires_followup && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="flex flex-col gap-2 overflow-hidden"
              >
                <label className="flex items-center gap-2 text-sm">
                  <Checkbox checked={bookCallback} onCheckedChange={(v) => setBookCallback(v === true)} />
                  Book callback
                </label>
                <AnimatePresence>
                  {bookCallback && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden pl-6"
                    >
                      <Input
                        type="datetime-local"
                        value={callbackAt}
                        onChange={(e) => setCallbackAt(e.target.value)}
                        className="w-56"
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )}
          </AnimatePresence>

          <Button variant="accent" size="lg" onClick={handleSave} disabled={pending} className="mt-1 w-full">
            {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
