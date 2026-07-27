import "server-only";
import * as XLSX from "xlsx";
import type { NormalisedLead } from "./types";

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
    | "postcode",
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
  };
}
