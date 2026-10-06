"use client";

import { useActionState, useEffect, useState } from "react";
import { useFormStatus } from "react-dom";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, Upload, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { uploadVendorCsv, type ActionResult } from "@/lib/actions/data-sources";
import { marketToCountryHint } from "@/lib/phone";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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

const initialState: ActionResult = {};

function SubmitButton({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending || disabled}>
      {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Import"}
    </Button>
  );
}

export function VendorCsvDialog({
  campaigns,
  dataSources,
  agents,
  teams,
}: {
  campaigns: { id: string; name: string; code: string; market: string | null }[];
  dataSources: { id: string; name: string }[];
  agents: { id: string; full_name: string | null; team_id: string | null }[];
  teams: { id: string; name: string }[];
}) {
  const [open, setOpen] = useState(false);
  const [state, formAction] = useActionState(uploadVendorCsv, initialState);
  const [campaignId, setCampaignId] = useState(campaigns[0]?.id ?? "");
  const [dataSourceId, setDataSourceId] = useState(dataSources[0]?.id ?? "");
  const [country, setCountry] = useState(marketToCountryHint(campaigns[0]?.market));
  const [countryTouched, setCountryTouched] = useState(false);
  const [assignMode, setAssignMode] = useState<"none" | "agent" | "team">("none");
  const [assignAgentId, setAssignAgentId] = useState("");
  const [assignTeamId, setAssignTeamId] = useState("");
  const [fileChosen, setFileChosen] = useState(false);
  const router = useRouter();

  // Default the phone-parsing country to whichever market the selected
  // campaign runs — this is what was silently defaulting to GB for every
  // campaign regardless of market, rejecting most non-UK/US numbers (a
  // Pakistan campaign's +92 leads included) as "invalid". Once the operator
  // touches the selector directly, stop overriding their choice.
  useEffect(() => {
    if (countryTouched) return;
    const campaign = campaigns.find((c) => c.id === campaignId);
    if (campaign) setCountry(marketToCountryHint(campaign.market));
  }, [campaignId, campaigns, countryTouched]);

  // Both selects default to the first item, which is an empty string when
  // the list is empty — that used to submit blank ids and come back as a
  // generic "Campaign, data source and a file are required", with no hint
  // that the real problem was missing prerequisite records.
  const missingPrereq =
    campaigns.length === 0 && dataSources.length === 0
      ? "both"
      : campaigns.length === 0
        ? "campaigns"
        : dataSources.length === 0
          ? "dataSources"
          : null;

  useEffect(() => {
    if (state.ok) {
      setOpen(false);
      setFileChosen(false);
      setAssignMode("none");
      setAssignAgentId("");
      setAssignTeamId("");
      router.refresh();

      // Previously this closed silently on success, with no indication of
      // what actually happened — including the case that bit us: a
      // re-upload meant to fix a missed assignment where every row is
      // rejected as a duplicate (already imported, unassigned from the
      // first pass) and nothing is actually assigned, with zero signal
      // that the "fix" did nothing.
      const { imported = 0, rejected = 0, assigned = 0 } = state;
      if (imported === 0 && rejected > 0) {
        toast.warning(
          `0 new leads imported — all ${rejected} row${rejected === 1 ? "" : "s"} matched leads already in this campaign. ` +
            `If you meant to assign an already-imported batch, use "Assign unassigned" on the campaign page instead of re-uploading.`,
          { duration: 10000 },
        );
      } else {
        const parts = [`${imported} imported`];
        if (assigned > 0) parts.push(`${assigned} assigned`);
        if (rejected > 0) parts.push(`${rejected} rejected`);
        toast.success(parts.join(" · "));
      }
    }
  }, [state, router]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button variant="secondary" size="sm" onClick={() => setOpen(true)}>
        <Upload className="h-3.5 w-3.5" /> Import vendor CSV
      </Button>
      <DialogContent className="max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Import vendor CSV / XLSX</DialogTitle>
          <DialogDescription>
            Columns are mapped automatically from the file&rsquo;s own headers — no review step. Every
            column the importer recognises (phone, name, company, address, …) is used directly;
            anything else is kept as-is and shown on the lead&rsquo;s Details view, so the agent sees
            everything the sheet had. Every row is still validated, suppression-screened and
            committed the same way as any other source.
          </DialogDescription>
        </DialogHeader>

        {missingPrereq && (
          <div className="flex items-start gap-2 rounded-md bg-warning-tint px-3 py-2 text-xs text-warning">
            <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <span>
              {missingPrereq === "both"
                ? "You need at least one campaign and one non-connector data source before importing."
                : missingPrereq === "campaigns"
                  ? "No campaigns exist yet — create one in Campaigns first."
                  : "No non-connector data source exists yet — add one with “Add data source” first, recording its lawful basis."}
            </span>
          </div>
        )}

        <form action={formAction} className="flex flex-col gap-3">
          <input type="hidden" name="campaign_id" value={campaignId} />
          <input type="hidden" name="data_source_id" value={dataSourceId} />
          <input type="hidden" name="country" value={country} />
          <input type="hidden" name="assign_to_agent_id" value={assignMode === "agent" ? assignAgentId : ""} />
          <input type="hidden" name="assign_to_team_id" value={assignMode === "team" ? assignTeamId : ""} />

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label>Campaign</Label>
              <Select value={campaignId} onValueChange={setCampaignId} disabled={campaigns.length === 0}>
                <SelectTrigger>
                  <SelectValue placeholder={campaigns.length === 0 ? "No campaigns yet" : "Pick a campaign"} />
                </SelectTrigger>
                <SelectContent>
                  {campaigns.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name} ({c.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Data source (must be vendor-licensed with a lawful basis)</Label>
              <Select
                value={dataSourceId}
                onValueChange={setDataSourceId}
                disabled={dataSources.length === 0}
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={dataSources.length === 0 ? "No data sources yet" : "Pick a data source"}
                  />
                </SelectTrigger>
                <SelectContent>
                  {dataSources.map((d) => (
                    <SelectItem key={d.id} value={d.id}>
                      {d.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Country (for phone parsing)</Label>
            <Select
              value={country}
              onValueChange={(v) => {
                setCountry(v);
                setCountryTouched(true);
              }}
            >
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="GB">GB — UK</SelectItem>
                <SelectItem value="US">US</SelectItem>
                <SelectItem value="PK">PK — Pakistan</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1.5 rounded-md border border-line p-3">
            <Label>Assign to (optional)</Label>
            <p className="text-xs text-muted">
              Tag every imported lead with an agent or team right away, skipping screening and the
              manual &ldquo;Assign to...&rdquo; step — leads land already assigned instead of
              Unassigned. Leave as None to import generically, as today.
            </p>
            <div className="flex gap-3">
              <Select
                value={assignMode}
                onValueChange={(v) => {
                  setAssignMode(v as "none" | "agent" | "team");
                  setAssignAgentId("");
                  setAssignTeamId("");
                }}
              >
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  <SelectItem value="agent">Agent</SelectItem>
                  <SelectItem value="team">Team</SelectItem>
                </SelectContent>
              </Select>

              {assignMode === "agent" && (
                <Select value={assignAgentId} onValueChange={setAssignAgentId}>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Pick an agent" />
                  </SelectTrigger>
                  <SelectContent>
                    {agents.map((a) => (
                      <SelectItem key={a.id} value={a.id}>
                        {a.full_name ?? "Unnamed agent"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}

              {assignMode === "team" && (
                <Select value={assignTeamId} onValueChange={setAssignTeamId}>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Pick a team" />
                  </SelectTrigger>
                  <SelectContent>
                    {teams.map((t) => (
                      <SelectItem key={t.id} value={t.id}>
                        {t.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="file">File (.csv, .xlsx)</Label>
            <Input
              id="file"
              name="file"
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={(e) => setFileChosen(Boolean(e.target.files?.[0]))}
              required
            />
          </div>

          <AnimatePresence>
            {state.error && (
              <motion.p
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="rounded-md bg-danger-tint px-3 py-2 text-xs text-danger"
              >
                {state.error}
              </motion.p>
            )}
          </AnimatePresence>

          <DialogFooter>
            <Button type="button" variant="secondary" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <SubmitButton
              disabled={
                !campaignId ||
                !dataSourceId ||
                !fileChosen ||
                (assignMode === "agent" && !assignAgentId) ||
                (assignMode === "team" && !assignTeamId)
              }
            />
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
