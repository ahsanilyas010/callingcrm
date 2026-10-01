import { redirect } from "next/navigation";
import { requireProfile } from "@/lib/auth/current-profile";
import { createClient } from "@/lib/supabase/server";
import { LeadDetailsDialog } from "@/app/(app)/admin/campaigns/[id]/lead-details-dialog";
import { PromoteContactDialog } from "./promote-contact-dialog";
import { LeadsTable, type LeadTableRow, type PipelineStatus } from "./leads-table";

export default async function MyLeadsPage() {
  const profile = await requireProfile();
  if (profile.role !== "agent") redirect("/");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // RLS (leads_select) already scopes this to leads assigned to the caller
  // — the explicit filter here is just for query efficiency, not security.
  const { data: leads } = await supabase
    .from("leads")
    .select("*")
    .eq("assigned_to", user.id)
    .order("updated_at", { ascending: false })
    .limit(500);

  const rows = leads ?? [];

  // Contacts from an import that had no phone number at all — not dialable
  // until an agent or manager sources one. RLS (unphoned_contacts_select)
  // scopes this to the caller's own assigned, not-yet-promoted rows.
  const { data: contacts } = await supabase
    .from("unphoned_contacts")
    .select("*")
    .eq("assigned_to", user.id)
    .is("promoted_lead_id", null)
    .order("created_at", { ascending: false })
    .limit(500);

  const contactRows = contacts ?? [];

  // Latest appointment per lead — drives the Appointment column and the
  // status filter bar. appointments has no direct RLS insert policy for
  // agents (only record_call_attempt() creates rows), but select is open to
  // the creating agent, which is exactly this page's audience.
  const leadIds = rows.map((l) => l.id);
  const { data: appointments } = leadIds.length
    ? await supabase
        .from("appointments")
        .select("lead_id, status, scheduled_at, created_at")
        .in("lead_id", leadIds)
        .order("created_at", { ascending: false })
    : { data: [] as { lead_id: string; status: string; scheduled_at: string | null; created_at: string }[] };

  const latestAppointmentByLead = new Map<string, { status: string; scheduled_at: string | null }>();
  for (const a of appointments ?? []) {
    if (!latestAppointmentByLead.has(a.lead_id)) {
      latestAppointmentByLead.set(a.lead_id, { status: a.status, scheduled_at: a.scheduled_at });
    }
  }

  // Latest real disposition per lead — the Disposition/Remarks columns
  // previously only ever read leads.custom's legacy pre-import fields
  // (priorContact()), so a lead that was actually dialed and dispositioned
  // through this app (e.g. "Not Interested", "Invalid Number") showed
  // nothing here even though leads.status already reflects it correctly.
  const { data: callAttempts } = leadIds.length
    ? await supabase
        .from("call_attempts")
        .select("lead_id, notes, ended_at, dispositions(label)")
        .in("lead_id", leadIds)
        .order("ended_at", { ascending: false })
    : { data: [] as { lead_id: string; notes: string | null; ended_at: string; dispositions: { label: string } | null }[] };

  const lastCallByLead = new Map<string, { dispositionLabel: string; notes: string | null; endedAt: string }>();
  for (const c of callAttempts ?? []) {
    if (!lastCallByLead.has(c.lead_id) && c.ended_at) {
      lastCallByLead.set(c.lead_id, {
        dispositionLabel: c.dispositions?.label ?? "Unknown",
        notes: c.notes,
        endedAt: c.ended_at,
      });
    }
  }

  function pipelineStatus(leadStatus: string, attemptCount: number, appointment?: { status: string }): PipelineStatus {
    if (leadStatus === "converted") return "converted";
    if (appointment?.status === "completed") return "meeting_completed";
    if (appointment?.status === "follow_up") return "follow_up_required";
    if (appointment?.status === "pending" || appointment?.status === "confirmed") return "appointment_booked";
    if (attemptCount > 0) return "contacted";
    return "other";
  }

  const tableRows: LeadTableRow[] = rows.map((l) => {
    const appointment = latestAppointmentByLead.get(l.id) ?? null;
    return {
      id: l.id,
      first_name: l.first_name,
      last_name: l.last_name,
      company_name: l.company_name,
      job_title: l.job_title,
      phone_e164: l.phone_e164,
      phone_raw: l.phone_raw,
      email: l.email,
      address_line1: l.address_line1,
      city: l.city,
      region: l.region,
      postcode: l.postcode,
      custom: l.custom,
      status: l.status,
      do_not_call: l.do_not_call,
      appointment,
      lastCall: lastCallByLead.get(l.id) ?? null,
      pipelineStatus: pipelineStatus(l.status, l.attempt_count, appointment ?? undefined),
    };
  });

  return (
    <div className="p-4">
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-ink">My leads</h2>
        <p className="text-xs text-muted">
          {rows.length} lead{rows.length === 1 ? "" : "s"} assigned to you. Edits here save
          straight to the lead — the dial workspace still pulls from the shared campaign queue.
        </p>
      </div>

      {contactRows.length > 0 && (
        <div className="mb-6">
          <div className="mb-2">
            <h3 className="text-sm font-semibold text-ink">
              Needs a phone number ({contactRows.length})
            </h3>
            <p className="text-xs text-muted">
              From a contacts export with no phone on file. Add one to move a contact into your
              dial queue.
            </p>
          </div>
          <div className="overflow-x-auto rounded-lg border border-line bg-white">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line bg-canvas text-left text-xs text-muted">
                  <th className="px-3 py-2 font-medium">Name</th>
                  <th className="px-3 py-2 font-medium">Role</th>
                  <th className="px-3 py-2 font-medium">Project</th>
                  <th className="px-3 py-2 font-medium">Email</th>
                  <th className="px-3 py-2 font-medium" />
                </tr>
              </thead>
              <tbody>
                {contactRows.map((c) => (
                  <tr key={c.id} className="h-[38px] border-b border-line last:border-0">
                    <td className="px-3 py-1.5 font-medium text-ink">
                      {[c.first_name, c.last_name].filter(Boolean).join(" ") || "—"}
                    </td>
                    <td className="px-3 py-1.5 text-muted">{c.role ?? "—"}</td>
                    <td className="max-w-[220px] truncate px-3 py-1.5 text-muted">
                      {c.project_title ?? "—"}
                    </td>
                    <td className="max-w-[200px] truncate px-3 py-1.5 text-muted">
                      {c.email ?? "—"}
                    </td>
                    <td className="px-3 py-1.5">
                      <div className="flex items-center justify-end gap-1">
                        <LeadDetailsDialog
                          leadName={[c.first_name, c.last_name].filter(Boolean).join(" ") || "This contact"}
                          custom={c.custom as Record<string, unknown> | null}
                        />
                        <PromoteContactDialog contact={c} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tableRows.length === 0 ? (
        <div className="rounded-lg border border-line bg-white px-3 py-8 text-center text-sm text-muted">
          No leads assigned to you yet.
        </div>
      ) : (
        <LeadsTable rows={tableRows} />
      )}
    </div>
  );
}
