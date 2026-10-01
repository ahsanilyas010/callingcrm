import "server-only";
import { createClient } from "@/lib/supabase/server";

export interface ClientAppointmentStats {
  booked: number;
  confirmed: number;
  completed: number;
  followUp: number;
}

export interface ClientAppointmentDailyRow {
  day: string;
  booked: number;
  confirmed: number;
  completed: number;
  follow_up: number;
  [key: string]: string | number;
}

const EMPTY: ClientAppointmentStats = { booked: 0, confirmed: 0, completed: 0, followUp: 0 };

// get_client_appointment_stats() self-scopes a client_viewer server-side
// (same pattern as get_client_funnel — see loadClientFunnel) so
// clientIdParam only ever takes effect for a manager previewing a specific
// client.
export async function loadClientAppointmentStats(clientIdParam: string | null): Promise<ClientAppointmentStats> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_client_appointment_stats", {
    p_client_id: clientIdParam ?? undefined,
  });

  if (error || !data) return EMPTY;
  return {
    booked: data.booked ?? 0,
    confirmed: data.confirmed ?? 0,
    completed: data.completed ?? 0,
    followUp: data.follow_up ?? 0,
  };
}

export async function loadClientAppointmentDaily(
  clientIdParam: string | null,
  days = 14,
): Promise<ClientAppointmentDailyRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_client_appointment_daily", {
    p_client_id: clientIdParam ?? undefined,
    p_days: days,
  });

  if (error || !data) return [];
  return data.map((row) => ({
    day: row.day ?? "",
    booked: row.booked ?? 0,
    confirmed: row.confirmed ?? 0,
    completed: row.completed ?? 0,
    follow_up: row.follow_up ?? 0,
  }));
}
