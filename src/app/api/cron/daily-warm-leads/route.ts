import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getEmailProvider } from "@/lib/email/provider";
import { renderDailyWarmLeadsEmail, type WarmLeadDigestRow } from "@/lib/reports/warm-leads-email";
import { captureException } from "@/lib/error-tracking";
import { BRAND } from "@/lib/brand";

// Fired daily by Vercel Cron (see vercel.json) — one digest per screener who
// has at least one open warm lead, listing everything still 'pending' or
// 'in_review'. Same shape as /api/cron/daily-client-report: no user session
// exists for a cron invocation, so this goes through the service-role
// client and the CRON_SECRET check stands in for auth.
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const auth = req.headers.get("authorization");
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();

  const { data: openWarmLeads } = await admin
    .from("warm_leads")
    .select(
      "id, status, disposition_code, created_at, assigned_screener_id, lead:leads(first_name, last_name, company_name, phone_e164), campaign:campaigns(name)",
    )
    .in("status", ["pending", "in_review"])
    .order("created_at", { ascending: true });

  const byScreener = new Map<string, WarmLeadDigestRow[]>();
  for (const row of openWarmLeads ?? []) {
    if (!row.assigned_screener_id) continue;
    const list = byScreener.get(row.assigned_screener_id) ?? [];
    list.push(row);
    byScreener.set(row.assigned_screener_id, list);
  }

  const results: { screenerId: string; sent: boolean; reason?: string }[] = [];

  for (const [screenerId, rows] of byScreener) {
    try {
      const { data: screenerAuth } = await admin.auth.admin.getUserById(screenerId);
      const email = screenerAuth?.user?.email;
      if (!email) {
        results.push({ screenerId, sent: false, reason: "no email on auth.users" });
        continue;
      }

      const { subject, html, text } = renderDailyWarmLeadsEmail(rows);
      const provider = getEmailProvider();
      const sendResult = await provider.send({
        to: email,
        from: `${process.env.EMAIL_DEFAULT_FROM_NAME ?? BRAND.emailFromName} <hello@${process.env.EMAIL_FROM_DOMAIN ?? BRAND.emailFromDomainFallback}>`,
        subject,
        html,
        text,
      });

      results.push({ screenerId, sent: sendResult.ok, reason: sendResult.ok ? undefined : sendResult.error });
    } catch (err) {
      captureException(err, { route: "/api/cron/daily-warm-leads", screenerId });
      results.push({ screenerId, sent: false, reason: "internal error" });
    }
  }

  return NextResponse.json({ day: new Date().toISOString().slice(0, 10), results });
}
