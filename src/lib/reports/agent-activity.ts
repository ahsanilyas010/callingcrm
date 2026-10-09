import "server-only";
import { createClient } from "@/lib/supabase/server";

// Manager/team-lead "who dialed what" report (Section-6-style naming to
// match the rest of this directory). Deliberately built straight on
// call_attempts rather than a new view — call_attempts_select RLS
// (is_manager() OR qa OR own agent_id OR team_lead scoped to
// my_team_members()) already gives a team_lead exactly "their own agents,
// nobody else's" for free, so this file adds no new access-control logic
// of its own; it only narrows further by agent/campaign/date when asked.

export interface AgentActivityFilters {
  agents: { id: string; full_name: string | null }[];
  campaigns: { id: string; name: string; code: string }[];
}

export interface AgentActivityCallRow {
  id: string;
  startedAt: string;
  endedAt: string | null;
  durationSeconds: number;
  agentName: string;
  leadName: string;
  phone: string;
  dispositionLabel: string;
  notes: string | null;
}

export interface AgentActivityDispositionRow {
  dispositionId: string | null;
  label: string;
  count: number;
  pct: number;
}

export type AgentActivityReport =
  | {
      ok: true;
      totalDialed: number;
      breakdown: AgentActivityDispositionRow[];
      calls: AgentActivityCallRow[];
    }
  | { ok: false; error: string };

// Scoped by profiles_select RLS the same way — a team_lead's query here
// only ever returns their own team's agents, so the filter dropdown can't
// offer a selection that would just come back empty.
export async function getAgentActivityFilters(): Promise<AgentActivityFilters> {
  const supabase = await createClient();
  const [{ data: agents }, { data: campaigns }] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, full_name")
      .eq("role", "agent")
      .order("full_name"),
    supabase.from("campaigns").select("id, name, code").order("name"),
  ]);
  return { agents: agents ?? [], campaigns: campaigns ?? [] };
}

function one<T>(v: T | T[] | null | undefined): T | null {
  if (v == null) return null;
  return Array.isArray(v) ? v[0] ?? null : v;
}

export async function getAgentActivityReport(params: {
  agentId?: string | null;
  campaignId?: string | null;
  from: string;
  to: string;
}): Promise<AgentActivityReport> {
  const supabase = await createClient();

  let query = supabase
    .from("call_attempts")
    .select(
      "id, started_at, ended_at, talk_seconds, notes, disposition_id, leads(first_name, last_name, company_name, phone_e164), dispositions(label), profiles!call_attempts_agent_id_fkey(full_name)",
    )
    .gte("started_at", `${params.from}T00:00:00.000Z`)
    .lte("started_at", `${params.to}T23:59:59.999Z`)
    .order("started_at", { ascending: false })
    // A hard cap, not a page size — past this, the CSV export (which
    // works off exactly these rows) should be scoped tighter by date
    // instead of silently growing unbounded.
    .limit(5000);

  if (params.agentId) query = query.eq("agent_id", params.agentId);
  if (params.campaignId) query = query.eq("campaign_id", params.campaignId);

  const { data, error } = await query;
  if (error) return { ok: false, error: error.message };

  const rows = data ?? [];

  const calls: AgentActivityCallRow[] = rows.map((r) => {
    const lead = one(
      r.leads as
        | { first_name: string | null; last_name: string | null; company_name: string | null; phone_e164: string }
        | { first_name: string | null; last_name: string | null; company_name: string | null; phone_e164: string }[]
        | null,
    );
    const disposition = one(r.dispositions as { label: string } | { label: string }[] | null);
    const agent = one(r.profiles as { full_name: string | null } | { full_name: string | null }[] | null);
    const started = new Date(r.started_at).getTime();
    const ended = r.ended_at ? new Date(r.ended_at).getTime() : started;
    return {
      id: r.id,
      startedAt: r.started_at,
      endedAt: r.ended_at,
      durationSeconds: r.talk_seconds ?? Math.max(0, Math.round((ended - started) / 1000)),
      agentName: agent?.full_name ?? "—",
      leadName: [lead?.first_name, lead?.last_name].filter(Boolean).join(" ") || lead?.company_name || "—",
      phone: lead?.phone_e164 ?? "—",
      dispositionLabel: disposition?.label ?? "No disposition",
      notes: r.notes,
    };
  });

  const counts = new Map<string, { label: string; count: number }>();
  for (const r of rows) {
    const key = r.disposition_id ?? "none";
    const disposition = one(r.dispositions as { label: string } | { label: string }[] | null);
    const label = disposition?.label ?? "No disposition";
    const existing = counts.get(key) ?? { label, count: 0 };
    existing.count += 1;
    counts.set(key, existing);
  }

  const total = rows.length;
  const breakdown: AgentActivityDispositionRow[] = Array.from(counts.entries())
    .map(([dispositionId, v]) => ({
      dispositionId: dispositionId === "none" ? null : dispositionId,
      label: v.label,
      count: v.count,
      pct: total > 0 ? Math.round((v.count / total) * 1000) / 10 : 0,
    }))
    .sort((a, b) => b.count - a.count);

  return { ok: true, totalDialed: total, breakdown, calls };
}
