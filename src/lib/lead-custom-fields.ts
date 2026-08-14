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
};
