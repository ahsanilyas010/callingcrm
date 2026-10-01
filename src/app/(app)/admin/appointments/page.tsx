import { redirect } from "next/navigation";
import { requireProfile } from "@/lib/auth/current-profile";
import { createClient } from "@/lib/supabase/server";
import { AppointmentsTable, type AppointmentTableRow } from "./appointments-table";

export default async function AppointmentsPage() {
  const profile = await requireProfile();
  if (!["super_admin", "ops_manager", "team_lead"].includes(profile.role)) redirect("/");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // RLS (appointments_select) already scopes this to the caller's own
  // bookings, their closer assignments, their team (team_lead), or
  // everything (is_manager()) — this page is simply the full table over
  // whatever that resolves to, with client-side filters on top.
  const { data: appointments } = await supabase
    .from("appointments")
    .select(
      "id, lead_id, status, scheduled_at, notes, lead:leads(first_name, last_name, company_name, phone_e164, status), campaign:campaigns(name), agent:profiles!appointments_created_by_fkey(full_name), closer:profiles!appointments_assigned_closer_id_fkey(id, full_name)",
    )
    .order("created_at", { ascending: false })
    .limit(500);

  const rows: AppointmentTableRow[] = (appointments ?? []).map((a) => ({
    id: a.id,
    leadId: a.lead_id,
    leadName: [a.lead?.first_name, a.lead?.last_name].filter(Boolean).join(" ") || a.lead?.company_name || "—",
    companyName: a.lead?.company_name ?? null,
    phone: a.lead?.phone_e164 ?? "—",
    campaignName: a.campaign?.name ?? "—",
    agentName: a.agent?.full_name ?? "—",
    closerName: a.closer?.full_name ?? null,
    closerId: a.closer?.id ?? null,
    status: a.status,
    scheduledAt: a.scheduled_at,
    notes: a.notes,
    leadConverted: a.lead?.status === "converted",
  }));

  return (
    <div className="p-4">
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-ink">Appointments</h2>
        <p className="text-xs text-muted">
          {rows.length} appointment{rows.length === 1 ? "" : "s"} booked by the sales team, tracked
          end to end — from &ldquo;appointment set&rdquo; through meeting completed or converted.
        </p>
      </div>

      <AppointmentsTable rows={rows} currentUserId={user.id} />
    </div>
  );
}
