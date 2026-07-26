"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import {
  Copy,
  Check,
  Phone,
  Clock,
  ChevronRight,
  ChevronDown,
  BookOpen,
  Ban,
} from "lucide-react";
import { cn } from "@/lib/utils";
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
import { MOCK_QUEUE, DISPOSITIONS } from "./mock-leads";

function useWrapTimer(active: boolean) {
  const [seconds, setSeconds] = useState(0);
  useEffect(() => {
    if (!active) {
      setSeconds(0);
      return;
    }
    const id = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [active]);
  return seconds;
}

function fmt(s: number) {
  const m = Math.floor(s / 60)
    .toString()
    .padStart(2, "0");
  const r = (s % 60).toString().padStart(2, "0");
  return `${m}:${r}`;
}

export function Workspace({ agentName, agentTimezone }: { agentName: string; agentTimezone: string }) {
  const [index, setIndex] = useState(0);
  const [disposition, setDisposition] = useState("");
  const [notes, setNotes] = useState("");
  const [bookCallback, setBookCallback] = useState(false);
  const [sendEmail, setSendEmail] = useState(false);
  const [callbackAt, setCallbackAt] = useState("");
  const [copied, setCopied] = useState(false);
  const [scriptOpen, setScriptOpen] = useState(true);
  const [touched, setTouched] = useState(false);

  const dispositionTriggerRef = useRef<HTMLButtonElement>(null);
  const notesRef = useRef<HTMLTextAreaElement>(null);

  const lead = MOCK_QUEUE[index % MOCK_QUEUE.length];
  const selected = DISPOSITIONS.find((d) => d.code === disposition);
  const wrapSeconds = useWrapTimer(touched);

  function resetPanel() {
    setDisposition("");
    setNotes("");
    setBookCallback(false);
    setSendEmail(false);
    setCallbackAt("");
    setTouched(false);
  }

  function handleSaveAndNext() {
    if (!disposition) {
      toast.error("Select a disposition first.");
      dispositionTriggerRef.current?.focus();
      return;
    }
    if (selected?.requiresNote && !notes.trim()) {
      toast.error("This disposition requires a note.");
      notesRef.current?.focus();
      return;
    }
    if (bookCallback && !callbackAt) {
      toast.error("Set a date and time for the callback.");
      return;
    }

    if (selected?.setsDnc) {
      toast.success(`${lead.phone} suppressed globally — DNC written in the same transaction.`, {
        icon: <Ban className="h-4 w-4" />,
      });
    } else {
      toast.success(`Saved — ${selected?.label}`);
    }

    resetPanel();
    setIndex((i) => i + 1);
  }

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const target = e.target as HTMLElement;
      const typing = ["INPUT", "TEXTAREA"].includes(target.tagName);

      if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        handleSaveAndNext();
        return;
      }
      if (typing) return;
      if (e.key.toLowerCase() === "d") {
        e.preventDefault();
        dispositionTriggerRef.current?.click();
      }
      if (e.key.toLowerCase() === "n") {
        e.preventDefault();
        notesRef.current?.focus();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [disposition, notes, bookCallback, callbackAt, index]);

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-line bg-white px-4 py-1.5">
        <div className="flex items-center gap-2 text-xs text-muted">
          <Badge variant="blue">CONST-UK</Badge>
          <span>{agentName}</span>
        </div>
        <div className="flex items-center gap-3 text-[11px] text-muted">
          <Badge variant="neutral">Preview · mock data, Phase 2/3 wires this to real leads</Badge>
          <span className="flex items-center gap-1 tabular">
            <Clock className="h-3 w-3" /> Wrap {fmt(wrapSeconds)}
          </span>
        </div>
      </div>

      <div className="grid flex-1 grid-cols-[200px_1fr_260px] overflow-hidden">
        {/* Queue */}
        <div className="flex flex-col border-r border-line bg-white p-3">
          <div className="mb-3 space-y-1.5 text-sm">
            <div className="flex items-center justify-between rounded-md bg-brand-orange-tint px-2 py-1.5">
              <span className="font-medium text-brand-orange-text">Due now</span>
              <span className="tabular font-semibold text-brand-orange-text">1</span>
            </div>
            <div className="flex items-center justify-between rounded-md px-2 py-1.5 text-muted">
              <span>Callbacks</span>
              <span className="tabular">2</span>
            </div>
            <div className="flex items-center justify-between rounded-md px-2 py-1.5 text-muted">
              <span>Fresh</span>
              <span className="tabular">142</span>
            </div>
          </div>
          <p className="mb-2 text-[11px] leading-snug text-muted">
            No lead browsing — the queue hands you the next lead to keep pacing honest.
          </p>
          <Button variant="secondary" size="sm" onClick={() => setIndex((i) => i + 1)}>
            <ChevronRight className="h-3.5 w-3.5" /> Skip to next
          </Button>
        </div>

        {/* Lead */}
        <div className="flex flex-col overflow-y-auto p-4">
          <AnimatePresence mode="wait">
            <motion.div
              key={lead.id + index}
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -12 }}
              transition={{ duration: 0.16 }}
              className="flex max-w-xl flex-col gap-4"
            >
              <div>
                <div className="mb-1 flex items-center gap-2">
                  <h2 className="text-lg font-semibold text-ink">
                    {lead.firstName} {lead.lastName}
                  </h2>
                  <Badge variant="neutral">
                    Attempt {lead.attempt} of {lead.maxAttempts}
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <a
                    href={`tel:${lead.phone.replace(/\s+/g, "")}`}
                    className="tabular flex items-center gap-1.5 text-xl font-medium text-ink hover:text-brand-blue"
                  >
                    <Phone className="h-4 w-4" /> {lead.phone}
                  </a>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={async () => {
                      await navigator.clipboard.writeText(lead.phone);
                      setCopied(true);
                      toast.success("Copied");
                      setTimeout(() => setCopied(false), 1200);
                    }}
                  >
                    {copied ? <Check className="h-4 w-4 text-brand-green-text" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              <div
                className={cn(
                  "flex items-center gap-2 rounded-md px-3 py-2 text-sm",
                  lead.inWindow ? "bg-brand-green-tint text-brand-green-text" : "bg-danger-tint text-danger",
                )}
              >
                <Clock className="h-4 w-4" />
                Local time {lead.localTime} · {lead.inWindow ? "in calling window" : "OUTSIDE WINDOW — blocked"}
                <span className="ml-auto text-xs opacity-70">Your time zone: {agentTimezone}</span>
              </div>

              <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 rounded-md border border-line bg-white p-3 text-sm">
                <div className="text-muted">Location</div>
                <div className="text-ink">
                  {lead.city} {lead.region} · {lead.propertyType}
                </div>
                <div className="text-muted">Project</div>
                <div className="text-ink">{lead.project}</div>
                <div className="text-muted">Source</div>
                <div className="text-ink">{lead.source}</div>
                <div className="text-muted">Screened</div>
                <div className="flex items-center gap-1 text-brand-green-text">
                  <Check className="h-3.5 w-3.5" /> {lead.screenedDaysAgo} days ago
                </div>
              </div>

              <div className="flex flex-col gap-3 rounded-md border border-line bg-white p-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium uppercase tracking-wide text-muted">
                    Disposition <kbd className="rounded border border-line px-1 text-[10px]">D</kbd>
                  </label>
                  <Select
                    value={disposition}
                    onValueChange={(v) => {
                      setDisposition(v);
                      setTouched(true);
                    }}
                  >
                    <SelectTrigger ref={dispositionTriggerRef}>
                      <SelectValue placeholder="Select outcome…" />
                    </SelectTrigger>
                    <SelectContent>
                      {DISPOSITIONS.map((d) => (
                        <SelectItem key={d.code} value={d.code}>
                          {d.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium uppercase tracking-wide text-muted">
                    Notes <kbd className="rounded border border-line px-1 text-[10px]">N</kbd>
                    {selected?.requiresNote && <span className="text-danger"> · required</span>}
                  </label>
                  <Textarea
                    ref={notesRef}
                    value={notes}
                    onChange={(e) => {
                      setNotes(e.target.value);
                      setTouched(true);
                    }}
                    rows={2}
                  />
                </div>

                <AnimatePresence>
                  {selected?.requiresFollowup && (
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
                      <label className="flex items-center gap-2 text-sm">
                        <Checkbox checked={sendEmail} onCheckedChange={(v) => setSendEmail(v === true)} />
                        Send email
                      </label>
                    </motion.div>
                  )}
                </AnimatePresence>

                <Button
                  variant="accent"
                  size="lg"
                  onClick={handleSaveAndNext}
                  className="mt-1 w-full"
                >
                  Save &amp; next <kbd className="ml-1.5 rounded bg-black/10 px-1.5 text-[10px]">Ctrl+Enter</kbd>
                </Button>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Script */}
        <div className="flex flex-col border-l border-line bg-white">
          <button
            onClick={() => setScriptOpen((o) => !o)}
            className="flex items-center justify-between border-b border-line px-3 py-2 text-xs font-medium text-muted hover:bg-canvas cursor-pointer"
          >
            <span className="flex items-center gap-1.5">
              <BookOpen className="h-3.5 w-3.5" /> Script
            </span>
            <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", !scriptOpen && "-rotate-90")} />
          </button>
          <AnimatePresence initial={false}>
            {scriptOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="space-y-3 p-3 text-xs">
                  <div>
                    <div className="mb-1 font-semibold text-danger">
                      Opening disclosure (must read)
                    </div>
                    <p className="text-muted">
                      &ldquo;Hi, this is {agentName.split(" ")[0]} calling on behalf of [client],
                      handled from our office outside the UK. Is now a good time?&rdquo;
                    </p>
                  </div>
                  <div>
                    <div className="mb-1 font-semibold text-ink">Talk track</div>
                    <p className="text-muted">
                      Reference the planning application / project. Confirm the homeowner is
                      still planning to proceed. Qualify budget and timeline.
                    </p>
                  </div>
                  <div>
                    <div className="mb-1 font-semibold text-ink">Objections</div>
                    <p className="text-muted">
                      &ldquo;Not interested&rdquo; → thank them, log the disposition, move on. Never
                      push past a clear no.
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
