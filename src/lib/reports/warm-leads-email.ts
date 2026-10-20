import "server-only";
import { BRAND } from "@/lib/brand";

export interface WarmLeadDigestRow {
  id: string;
  status: string;
  disposition_code: string;
  created_at: string;
  lead: { first_name: string | null; last_name: string | null; company_name: string | null; phone_e164: string } | null;
  campaign: { name: string } | null;
}

// Separate file from daily-agent-email.ts on purpose: that one is
// specifically the client-aggregate report (its own header comment says
// "deliberately no agent name anywhere... same boundary as the client
// dashboard") — a warm-leads digest is per-lead, not an aggregate, and its
// audience is internal staff, not an external client. Conflating them
// would break that file's own stated boundary.
export function renderDailyWarmLeadsEmail(rows: WarmLeadDigestRow[]) {
  const day = new Date().toISOString().slice(0, 10);
  const dashboardUrl = `${process.env.APP_BASE_URL ?? "https://app.example.com"}/admin/warm-leads`;
  const subject = `Warm leads awaiting review — ${rows.length} open — ${day}`;

  const rowHtml = rows
    .map((r) => {
      const name = [r.lead?.first_name, r.lead?.last_name].filter(Boolean).join(" ") || r.lead?.company_name || "—";
      const age = Math.max(0, Math.round((Date.now() - new Date(r.created_at).getTime()) / (60 * 60 * 1000)));
      return `
        <tr>
          <td style="padding: 6px 8px; border-bottom: 1px solid #eee;">${name}${r.lead?.company_name ? ` <span style="color:#999;">· ${r.lead.company_name}</span>` : ""}</td>
          <td style="padding: 6px 8px; border-bottom: 1px solid #eee;">${r.lead?.phone_e164 ?? "—"}</td>
          <td style="padding: 6px 8px; border-bottom: 1px solid #eee;">${r.campaign?.name ?? "—"}</td>
          <td style="padding: 6px 8px; border-bottom: 1px solid #eee;">${r.disposition_code.replace(/_/g, " ")}</td>
          <td style="padding: 6px 8px; border-bottom: 1px solid #eee;">${age}h ago</td>
        </tr>
      `;
    })
    .join("");

  const html = `
    <div style="font-family: -apple-system, Segoe UI, Arial, sans-serif; max-width: 640px; margin: 0 auto; color: #1a1a1a;">
      <h2 style="margin: 0 0 4px;">Warm leads awaiting review</h2>
      <p style="margin: 0 0 20px; color: #666; font-size: 13px;">${rows.length} open — ${day}</p>

      ${
        rows.length === 0
          ? `<p style="font-size: 13px; color: #666;">Nothing open right now.</p>`
          : `<table style="width: 100%; border-collapse: collapse; font-size: 13px;">
              <thead>
                <tr style="text-align: left; color: #666; text-transform: uppercase; font-size: 11px;">
                  <th style="padding: 6px 8px;">Contact</th>
                  <th style="padding: 6px 8px;">Phone</th>
                  <th style="padding: 6px 8px;">Campaign</th>
                  <th style="padding: 6px 8px;">Routed from</th>
                  <th style="padding: 6px 8px;">Age</th>
                </tr>
              </thead>
              <tbody>${rowHtml}</tbody>
            </table>`
      }

      <p style="margin: 20px 0 0; font-size: 13px;">
        <a href="${dashboardUrl}" style="color: #2563eb;">Open the warm leads queue →</a>
      </p>

      <p style="margin: 24px 0 0; font-size: 11px; color: #999;">
        Sent automatically by ${BRAND.productName} — one digest per screener, every morning.
      </p>
    </div>
  `.trim();

  const text = [
    `Warm leads awaiting review — ${rows.length} open — ${day}`,
    ``,
    ...rows.map((r) => {
      const name = [r.lead?.first_name, r.lead?.last_name].filter(Boolean).join(" ") || r.lead?.company_name || "—";
      return `- ${name} (${r.lead?.phone_e164 ?? "—"}) — ${r.campaign?.name ?? "—"} — ${r.disposition_code.replace(/_/g, " ")}`;
    }),
    ``,
    `Open the queue: ${dashboardUrl}`,
  ].join("\n");

  return { subject, html, text };
}
