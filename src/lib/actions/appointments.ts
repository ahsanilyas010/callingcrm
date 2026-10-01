"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getEmailProvider } from "@/lib/email/provider";
import { BRAND } from "@/lib/brand";
import type { Enums } from "@/lib/supabase/types";

export interface ActionResult {
  error?: string;
  ok?: boolean;
}

// Fires right after record_call_attempt() creates an appointments row for
// an 'appointment_set' disposition (see submitCallAttempt in workspace.ts).
// Mirrors the cron report's send pattern (src/app/api/cron/daily-client-report/route.ts):
// call the provider directly, no email_sends row — this isn't lead outreach,
// it's an internal staff notification with nothing to suppress against.
export async function notifyCloserOfAppointment(appointmentId: string): Promise<ActionResult> {
  const supabase = await createClient();

  const { data: appointment } = await supabase
    .from("appointments")
    .select(
      "id, scheduled_at, notes, lead:leads(first_name, last_name, company_name, job_title, phone_e164, email, custom), agent:profiles!appointments_created_by_fkey(full_name)",
    )
    .eq("id", appointmentId)
    .single();

  if (!appointment) return { error: "Appointment not found." };

  const lead = appointment.lead;
  const agentName = appointment.agent?.full_name ?? "An agent";
  const custom = (lead?.custom as Record<string, unknown> | null) ?? {};
  const projectInfo = [
    typeof custom.project_type === "string" ? `Project: ${custom.project_type}` : null,
    typeof custom.company_website === "string" ? `Website: ${custom.company_website}` : null,
  ]
    .filter(Boolean)
    .join(" · ");

  const contactName = [lead?.first_name, lead?.last_name].filter(Boolean).join(" ") || "Unknown contact";
  const appBaseUrl = process.env.APP_BASE_URL ?? "http://localhost:3000";
  const scheduledLabel = appointment.scheduled_at
    ? new Date(appointment.scheduled_at).toLocaleString("en-GB", { dateStyle: "full", timeStyle: "short" })
    : "Not proposed yet";

  const html = `
    <p>${agentName} just booked a new appointment.</p>
    <table cellpadding="4">
      <tr><td><strong>Company</strong></td><td>${lead?.company_name ?? "—"}</td></tr>
      <tr><td><strong>Contact</strong></td><td>${contactName}${lead?.job_title ? ` (${lead.job_title})` : ""}</td></tr>
      <tr><td><strong>Phone</strong></td><td>${lead?.phone_e164 ?? "—"}</td></tr>
      <tr><td><strong>Email</strong></td><td>${lead?.email ?? "—"}</td></tr>
      ${projectInfo ? `<tr><td><strong>Project</strong></td><td>${projectInfo}</td></tr>` : ""}
      <tr><td><strong>Proposed time</strong></td><td>${scheduledLabel}</td></tr>
      ${appointment.notes ? `<tr><td><strong>Call notes</strong></td><td>${appointment.notes}</td></tr>` : ""}
    </table>
    <p><a href="${appBaseUrl}/admin/appointments">Open the appointments queue</a></p>
  `;
  const text = `${agentName} just booked a new appointment.
Company: ${lead?.company_name ?? "—"}
Contact: ${contactName}${lead?.job_title ? ` (${lead.job_title})` : ""}
Phone: ${lead?.phone_e164 ?? "—"}
Email: ${lead?.email ?? "—"}
${projectInfo ? `${projectInfo}\n` : ""}Proposed time: ${scheduledLabel}
${appointment.notes ? `Notes: ${appointment.notes}\n` : ""}
Open: ${appBaseUrl}/admin/appointments`;

  const provider = getEmailProvider();
  const result = await provider.send({
    to: process.env.CLOSER_NOTIFY_EMAIL ?? "nehalksyed3@gmail.com",
    cc: process.env.CLOSER_NOTIFY_CC ?? "ahsanilyas35@gmail.com",
    from: `${process.env.EMAIL_DEFAULT_FROM_NAME ?? BRAND.emailFromName} <hello@${process.env.EMAIL_FROM_DOMAIN ?? BRAND.emailFromDomainFallback}>`,
    subject: `New appointment: ${lead?.company_name ?? contactName}`,
    html,
    text,
  });

  if (!result.ok) return { error: result.error };
  return { ok: true };
}

// The one write path for an appointment's status — used by both the
// closer's and manager's UI. Delegates to update_appointment_status() so
// the status change and its history row are written atomically (same
// reasoning as record_call_attempt() keeping DNC-suppression in one
// transaction).
export async function updateAppointmentStatus(
  appointmentId: string,
  status: Enums<"appointment_status">,
  note: string | null,
): Promise<ActionResult> {
  const supabase = await createClient();

  const { error } = await supabase.rpc("update_appointment_status", {
    p_appointment_id: appointmentId,
    p_status: status,
    p_note: note || undefined,
  });

  if (error) return { error: error.message };

  revalidatePath("/workspace/leads");
  revalidatePath("/admin/appointments");
  return { ok: true };
}

// Campaign-closer roster management — literal clone of assignAgentToCampaign
// / removeAgentFromCampaign (src/lib/actions/assignment.ts), backed by
// campaign_closers instead of campaign_assignments. Authorization is RLS-only
// (campaign_closers_write requires is_manager()): the .select() check below
// exists for the same reason as assignAgentToCampaign's — an upsert/delete
// that RLS silently filters to zero rows succeeds without an error.
export async function assignCloserToCampaign(campaignId: string, userId: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("campaign_closers")
    .upsert({ campaign_id: campaignId, user_id: userId }, { onConflict: "campaign_id,user_id" })
    .select("campaign_id");

  if (error) return { error: error.message };
  if (!data || data.length === 0) {
    return { error: "Couldn't add that closer — the campaign may not exist, or you may not have access." };
  }
  revalidatePath("/admin/campaigns", "layout");
  return { ok: true };
}

export async function removeCloserFromCampaign(campaignId: string, userId: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("campaign_closers")
    .delete()
    .eq("campaign_id", campaignId)
    .eq("user_id", userId)
    .select("campaign_id");

  if (error) return { error: error.message };
  if (!data || data.length === 0) {
    return { error: "That closer wasn't on this roster — nothing to remove." };
  }
  revalidatePath("/admin/campaigns", "layout");
  return { ok: true };
}

export async function markLeadConverted(leadId: string): Promise<ActionResult> {
  const supabase = await createClient();

  const { error } = await supabase.from("leads").update({ status: "converted" }).eq("id", leadId);
  if (error) return { error: error.message };

  revalidatePath("/workspace/leads");
  revalidatePath("/admin/appointments");
  return { ok: true };
}
