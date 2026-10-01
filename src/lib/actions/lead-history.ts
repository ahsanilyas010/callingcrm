"use server";

import { createClient } from "@/lib/supabase/server";

export interface LeadHistoryEvent {
  id: string;
  type: "call" | "status_change";
  at: string | null;
  label: string;
  note: string | null;
}

// Single merged timeline for a lead's drill-down: every disposition logged
// (call_attempts — the complete call history already captured by
// record_call_attempt()) plus every appointment status change
// (appointment_status_history — append-only, never overwrites a remark).
export async function getLeadHistory(leadId: string): Promise<LeadHistoryEvent[]> {
  const supabase = await createClient();

  const [{ data: calls }, { data: appointments }] = await Promise.all([
    supabase
      .from("call_attempts")
      .select("id, ended_at, notes, dispositions(label)")
      .eq("lead_id", leadId)
      .order("ended_at", { ascending: false }),
    supabase.from("appointments").select("id").eq("lead_id", leadId),
  ]);

  const appointmentIds = (appointments ?? []).map((a) => a.id);
  const { data: statusHistory } = appointmentIds.length
    ? await supabase
        .from("appointment_status_history")
        .select("id, status, note, changed_at")
        .in("appointment_id", appointmentIds)
        .order("changed_at", { ascending: false })
    : { data: [] as { id: string; status: string; note: string | null; changed_at: string }[] };

  const events: LeadHistoryEvent[] = [
    ...(calls ?? []).map((c) => ({
      id: c.id,
      type: "call" as const,
      at: c.ended_at,
      label: c.dispositions?.label ?? "Call logged",
      note: c.notes,
    })),
    ...(statusHistory ?? []).map((s) => ({
      id: s.id,
      type: "status_change" as const,
      at: s.changed_at,
      label: `Appointment → ${s.status.replace(/_/g, " ")}`,
      note: s.note,
    })),
  ];

  events.sort((a, b) => new Date(b.at ?? 0).getTime() - new Date(a.at ?? 0).getTime());
  return events;
}
