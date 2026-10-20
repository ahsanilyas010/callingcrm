"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getEmailProvider } from "@/lib/email/provider";
import { BRAND } from "@/lib/brand";
import type { Enums } from "@/lib/supabase/types";

export interface ActionResult {
  error?: string;
  ok?: boolean;
}

// Fires right after record_call_attempt() creates a warm_leads row (see
// submitCallAttempt in workspace.ts). Unlike notifyCloserOfAppointment
// (src/lib/actions/appointments.ts), this looks up the ACTUAL assigned
// screener's email rather than a hardcoded address — profiles has no email
// column (emails live only in auth.users), so this needs the service-role
// client's auth.admin.getUserById, not a plain profiles select.
export async function notifyScreenerOfWarmLead(warmLeadId: string): Promise<ActionResult> {
  const supabase = await createClient();

  const { data: warmLead } = await supabase
    .from("warm_leads")
    .select(
      "id, disposition_code, agent_notes, assigned_screener_id, lead:leads(first_name, last_name, company_name, job_title, phone_e164, email, custom), agent:profiles!warm_leads_created_by_fkey(full_name)",
    )
    .eq("id", warmLeadId)
    .single();

  if (!warmLead) return { error: "Warm lead not found." };
  if (!warmLead.assigned_screener_id) return { error: "No screener configured for this campaign." };

  const admin = createAdminClient();
  const { data: screenerAuth, error: screenerError } = await admin.auth.admin.getUserById(
    warmLead.assigned_screener_id,
  );
  if (screenerError || !screenerAuth.user?.email) {
    return { error: "Couldn't find the assigned screener's email." };
  }

  const lead = warmLead.lead;
  const agentName = warmLead.agent?.full_name ?? "An agent";
  const contactName = [lead?.first_name, lead?.last_name].filter(Boolean).join(" ") || "Unknown contact";
  const appBaseUrl = process.env.APP_BASE_URL ?? "http://localhost:3000";
  const dispositionLabel = warmLead.disposition_code.replace(/_/g, " ");

  const html = `
    <p>${agentName} just logged a warm lead (${dispositionLabel}).</p>
    <table cellpadding="4">
      <tr><td><strong>Company</strong></td><td>${lead?.company_name ?? "—"}</td></tr>
      <tr><td><strong>Contact</strong></td><td>${contactName}${lead?.job_title ? ` (${lead.job_title})` : ""}</td></tr>
      <tr><td><strong>Phone</strong></td><td>${lead?.phone_e164 ?? "—"}</td></tr>
      <tr><td><strong>Email</strong></td><td>${lead?.email ?? "—"}</td></tr>
      ${warmLead.agent_notes ? `<tr><td><strong>Call notes</strong></td><td>${warmLead.agent_notes}</td></tr>` : ""}
    </table>
    <p><a href="${appBaseUrl}/admin/warm-leads">Open the warm leads queue</a></p>
  `;
  const text = `${agentName} just logged a warm lead (${dispositionLabel}).
Company: ${lead?.company_name ?? "—"}
Contact: ${contactName}${lead?.job_title ? ` (${lead.job_title})` : ""}
Phone: ${lead?.phone_e164 ?? "—"}
Email: ${lead?.email ?? "—"}
${warmLead.agent_notes ? `Notes: ${warmLead.agent_notes}\n` : ""}Open: ${appBaseUrl}/admin/warm-leads`;

  const provider = getEmailProvider();
  const result = await provider.send({
    to: screenerAuth.user.email,
    from: `${process.env.EMAIL_DEFAULT_FROM_NAME ?? BRAND.emailFromName} <hello@${process.env.EMAIL_FROM_DOMAIN ?? BRAND.emailFromDomainFallback}>`,
    subject: `New warm lead: ${lead?.company_name ?? contactName}`,
    html,
    text,
  });

  if (!result.ok) return { error: result.error };
  return { ok: true };
}

// The one write path for a warm lead's status — delegates to
// update_warm_lead_status() so the status change, its history row, and the
// loop-back followup (for anything other than 'converted') are all written
// atomically. Same shape as updateAppointmentStatus.
export async function updateWarmLeadStatus(
  warmLeadId: string,
  status: Enums<"warm_lead_status">,
  note: string | null,
): Promise<ActionResult> {
  const supabase = await createClient();

  const { error } = await supabase.rpc("update_warm_lead_status", {
    p_warm_lead_id: warmLeadId,
    p_status: status,
    p_note: note || undefined,
  });

  if (error) return { error: error.message };

  revalidatePath("/admin/warm-leads");
  revalidatePath("/workspace/followups");
  return { ok: true };
}
