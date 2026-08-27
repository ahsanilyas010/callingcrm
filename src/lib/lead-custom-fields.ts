// Labels for keys stored under leads.custom by the vendor-CSV import path
// (src/lib/connectors/vendor-csv.ts) — split into its own client-safe
// module since the import dialog (server-only pipeline) and the lead
// details view (client component) both need these labels.
export const CUSTOM_FIELD_LABELS: Record<string, string> = {
  council: "Council",
  project_name: "Name",
  project_type: "Project type",
  units: "Units",
  summary: "Summary",
  decision: "Decision",
  decision_date: "Decision date",
  contact_name_address: "Contact name & address",
  portal_url: "Portal URL",
  source_notes: "Notes (from source)",
  // Worked-lead history carried over from a pre-existing outreach
  // spreadsheet (agent-compiled call/email log), rather than produced by
  // this app's own call-attempt/email-send pipeline — kept as read-only
  // source context, not treated as a live disposition or send record.
  prior_disposition: "Prior disposition (source)",
  email_status_source: "Email status (source)",
  reply_outcome: "Reply / outcome (source)",
  new_remarks: "Agent remarks (source)",
  appointment_set: "Appointment noted (source)",
  follow_up_date_source: "Follow-up date (source)",
  source_sheet: "Source sheet",
  source_row: "Source row #",
};
