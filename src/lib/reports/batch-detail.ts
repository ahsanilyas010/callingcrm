import "server-only";
import { createClient } from "@/lib/supabase/server";

export interface BatchLeadRow {
  id: string;
  name: string;
  phone: string;
  status: string;
  doNotCall: boolean;
  attemptCount: number;
  lastDispositionLabel: string | null;
  lastAttemptAt: string | null;
}

export interface BatchDispositionRow {
  label: string;
  count: number;
  pct: number;
}

export interface BatchSummary {
  id: string;
  originalFilename: string | null;
  campaignName: string | null;
  dataSourceName: string | null;
  uploaderName: string | null;
  acquiredAt: string | null;
  status: string;
  rowsTotal: number;
  rowsAccepted: number;
  rowsRejected: number;
  rowsDuplicate: number;
  rowsSuppressed: number;
}

export interface BatchDetail {
  summary: BatchSummary;
  dispositionBreakdown: BatchDispositionRow[];
  leads: BatchLeadRow[];
}

function one<T>(v: T | T[] | null | undefined): T | null {
  if (v == null) return null;
  return Array.isArray(v) ? v[0] ?? null : v;
}

// leads.last_disposition_id carries no FK constraint (it's a plain uuid
// column, not declared as a relationship), so PostgREST can't embed
// dispositions through it — resolved via a lookup map instead, same as
// every other un-FK'd id in this codebase.
export async function getBatchDetail(batchId: string): Promise<BatchDetail | null> {
  const supabase = await createClient();

  const { data: batch } = await supabase
    .from("lead_batches")
    .select(
      "*, campaigns(name, code), data_sources(name), profiles!lead_batches_uploaded_by_fkey(full_name)",
    )
    .eq("id", batchId)
    .maybeSingle();
  if (!batch) return null;

  const [{ data: leads }, { data: dispositions }] = await Promise.all([
    supabase
      .from("leads")
      .select(
        "id, first_name, last_name, company_name, phone_e164, status, do_not_call, attempt_count, last_disposition_id, last_attempt_at",
      )
      .eq("batch_id", batchId)
      .order("created_at", { ascending: true }),
    supabase.from("dispositions").select("id, label"),
  ]);

  const labelById = new Map((dispositions ?? []).map((d) => [d.id, d.label]));
  const rows = leads ?? [];

  const leadRows: BatchLeadRow[] = rows.map((l) => ({
    id: l.id,
    name: [l.first_name, l.last_name].filter(Boolean).join(" ") || l.company_name || "—",
    phone: l.phone_e164,
    status: l.status,
    doNotCall: l.do_not_call,
    attemptCount: l.attempt_count,
    lastDispositionLabel: l.last_disposition_id ? labelById.get(l.last_disposition_id) ?? null : null,
    lastAttemptAt: l.last_attempt_at,
  }));

  const dialed = rows.filter((l) => l.attempt_count > 0);
  const counts = new Map<string, number>();
  for (const l of dialed) {
    const label = l.last_disposition_id ? labelById.get(l.last_disposition_id) ?? "Unknown" : "Unknown";
    counts.set(label, (counts.get(label) ?? 0) + 1);
  }
  const dispositionBreakdown: BatchDispositionRow[] = Array.from(counts.entries())
    .map(([label, count]) => ({
      label,
      count,
      pct: dialed.length > 0 ? Math.round((count / dialed.length) * 1000) / 10 : 0,
    }))
    .sort((a, b) => b.count - a.count);

  const campaign = one(batch.campaigns as { name: string; code: string } | { name: string; code: string }[] | null);
  const dataSource = one(batch.data_sources as { name: string } | { name: string }[] | null);
  const uploader = one(batch.profiles as { full_name: string | null } | { full_name: string | null }[] | null);

  return {
    summary: {
      id: batch.id,
      originalFilename: batch.original_filename,
      campaignName: campaign ? `${campaign.code} — ${campaign.name}` : null,
      dataSourceName: dataSource?.name ?? null,
      uploaderName: uploader?.full_name ?? null,
      acquiredAt: batch.acquired_at,
      status: batch.status,
      rowsTotal: batch.rows_total,
      rowsAccepted: batch.rows_accepted,
      rowsRejected: batch.rows_rejected,
      rowsDuplicate: batch.rows_duplicate,
      rowsSuppressed: batch.rows_suppressed,
    },
    dispositionBreakdown,
    leads: leadRows,
  };
}
