import "server-only";
import * as XLSX from "xlsx";
import type { NormalisedLead } from "./types";
import { guessColumnMapping } from "@/lib/vendor-csv-auto-map";

// Section 6.4 — "Vendor CSV | Both | Licensed | Generic import path with
// mandatory provenance capture." Handles .csv and .xlsx uniformly via
// SheetJS; the caller supplies a column mapping (which spreadsheet header
// maps to which lead field) collected from the operator at upload time —
// there is no guessed/implicit mapping, since a wrong guess here is exactly
// the kind of silent error the spec warns about.

export type VendorCsvFieldMap = Partial<
  Record<
    | "externalRef"
    | "firstName"
    | "lastName"
    | "companyName"
    | "jobTitle"
    | "phone"
    | "email"
    | "addressLine1"
    | "addressLine2"
    | "city"
    | "region"
    | "postcode"
    // Project-context fields — no dedicated leads column, so these land in
    // leads.custom instead. Matches the planning/construction-lead sheet
    // format (Council, Project Type, Decision, Portal URL, ...) that
    // doesn't fit the generic contact schema above.
    | "council"
    | "projectName"
    | "projectType"
    | "units"
    | "summary"
    | "decision"
    | "decisionDate"
    | "contactNameAddress"
    | "portalUrl"
    | "sourceNotes"
    // Planning-application tracker fields — same "no dedicated leads
    // column" reasoning as the block above. "disposition" reuses the
    // prior_disposition custom key so an imported prior outcome shows up
    // through the same "Worked before" banner / My Leads badge as the
    // spreadsheet-import path already does.
    | "applicationDate"
    | "authority"
    | "category"
    | "applicationType"
    | "proposal"
    | "architectName"
    | "web"
    | "contact"
    | "comments"
    | "disposition",
    string
  >
>;

export function parseVendorFile(buffer: ArrayBuffer): {
  headers: string[];
  rows: Record<string, unknown>[];
} {
  const workbook = XLSX.read(buffer, { type: "array" });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: null });
  const headers = rows.length > 0 ? Object.keys(rows[0]) : [];
  return { headers, rows };
}

// guessColumnMapping (src/lib/vendor-csv-auto-map.ts) produces "map_xxx" ->
// raw header keys for the admin dialog's old manual-review UI. This is the
// same guesser run headless, with no review step: whichever column it
// finds for a field is what gets used, full stop. The map_xxx names don't
// match VendorCsvFieldMap's own property names, so translate them.
const MAP_KEY_TO_FIELD: Record<string, keyof VendorCsvFieldMap> = {
  map_phone: "phone",
  map_first_name: "firstName",
  map_last_name: "lastName",
  map_contact_name_address: "contactNameAddress",
  map_company_name: "companyName",
  map_job_title: "jobTitle",
  map_email: "email",
  map_address: "addressLine1",
  map_city: "city",
  map_region: "region",
  map_postcode: "postcode",
  map_external_ref: "externalRef",
  map_council: "council",
  map_authority: "authority",
  map_project_name: "projectName",
  map_project_type: "projectType",
  map_application_type: "applicationType",
  map_category: "category",
  map_application_date: "applicationDate",
  map_units: "units",
  map_summary: "summary",
  map_proposal: "proposal",
  map_architect_name: "architectName",
  map_decision: "decision",
  map_decision_date: "decisionDate",
  map_disposition: "disposition",
  map_contact: "contact",
  map_portal_url: "portalUrl",
  map_web: "web",
  map_source_notes: "sourceNotes",
  map_comments: "comments",
};

export function autoMapVendorColumns(headers: string[]): VendorCsvFieldMap {
  const guessed = guessColumnMapping(headers);
  const fieldMap: VendorCsvFieldMap = {};
  for (const [mapKey, header] of Object.entries(guessed)) {
    const field = MAP_KEY_TO_FIELD[mapKey];
    if (field) fieldMap[field] = header;
  }
  return fieldMap;
}

export function normaliseVendorRow(
  row: Record<string, unknown>,
  fieldMap: VendorCsvFieldMap,
  countryHint: string,
): NormalisedLead | null {
  const get = (key?: string) => {
    if (!key) return undefined;
    const v = row[key];
    return v === null || v === undefined ? undefined : String(v).trim() || undefined;
  };

  const phoneRaw = get(fieldMap.phone);
  if (!phoneRaw) return null;

  const custom: Record<string, string> = {};
  const setCustom = (key: string, value?: string) => {
    if (value) custom[key] = value;
  };
  setCustom("council", get(fieldMap.council));
  setCustom("project_name", get(fieldMap.projectName));
  setCustom("project_type", get(fieldMap.projectType));
  setCustom("units", get(fieldMap.units));
  setCustom("summary", get(fieldMap.summary));
  setCustom("decision", get(fieldMap.decision));
  setCustom("decision_date", get(fieldMap.decisionDate));
  setCustom("contact_name_address", get(fieldMap.contactNameAddress));
  setCustom("portal_url", get(fieldMap.portalUrl));
  setCustom("source_notes", get(fieldMap.sourceNotes));
  setCustom("application_date", get(fieldMap.applicationDate));
  setCustom("authority", get(fieldMap.authority));
  setCustom("category", get(fieldMap.category));
  setCustom("application_type", get(fieldMap.applicationType));
  setCustom("proposal", get(fieldMap.proposal));
  setCustom("architect_name", get(fieldMap.architectName));
  setCustom("web", get(fieldMap.web));
  setCustom("contact", get(fieldMap.contact));
  setCustom("comments", get(fieldMap.comments));
  setCustom("prior_disposition", get(fieldMap.disposition));

  // Every column the auto-mapper didn't claim for a dedicated field still
  // gets kept, under its own original header, instead of being silently
  // dropped — the agent should see everything the uploaded sheet had, not
  // just the subset this importer has a named slot for.
  const consumedHeaders = new Set(Object.values(fieldMap).filter((v): v is string => Boolean(v)));
  for (const header of Object.keys(row)) {
    if (consumedHeaders.has(header) || header in custom) continue;
    setCustom(header, get(header));
  }

  return {
    externalRef: get(fieldMap.externalRef),
    firstName: get(fieldMap.firstName),
    lastName: get(fieldMap.lastName),
    companyName: get(fieldMap.companyName),
    jobTitle: get(fieldMap.jobTitle),
    phoneRaw,
    email: get(fieldMap.email),
    countryHint,
    addressLine1: get(fieldMap.addressLine1),
    city: get(fieldMap.city),
    region: get(fieldMap.region),
    postcode: get(fieldMap.postcode),
    custom: Object.keys(custom).length > 0 ? custom : undefined,
  };
}
