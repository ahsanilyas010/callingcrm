// Best-effort auto-mapping from a vendor file's own column headers to the
// lead fields the import dialog needs. Runs client-side against whatever
// headers SheetJS found — never guesses at *content*, only header text —
// so a wrong guess here is exactly as visible and correctable as a manual
// pick: it just pre-fills the same dropdown, it doesn't skip it.
const FIELD_KEYWORDS: Record<string, string[]> = {
  map_phone: [
    "phone number", "phone", "mobile number", "mobile", "cell", "cell phone",
    "telephone", "tel", "contact number", "msisdn",
  ],
  map_email: ["email address", "email", "e-mail", "e mail"],
  map_first_name: ["first name", "firstname", "given name", "forename", "fname"],
  map_last_name: ["last name", "lastname", "surname", "family name", "lname"],
  map_company_name: ["company name", "company", "organisation", "organization", "business name", "employer"],
  map_job_title: ["job title", "title", "position", "designation", "role"],
  map_address: ["address line 1", "address line1", "address1", "street address", "address", "street"],
  map_city: ["city", "town"],
  map_region: ["region", "state", "county", "province"],
  map_postcode: ["postcode", "postal code", "zip code", "zip"],
  map_external_ref: ["external reference", "external ref", "external id", "reference", "ref", "id"],
};

// Order matters: more specific/higher-priority fields claim a header
// first, so e.g. "Phone" can't accidentally be claimed by a looser field
// that happens to be checked first.
const FIELD_PRIORITY = Object.keys(FIELD_KEYWORDS);

function normalise(header: string): string {
  return header
    .toLowerCase()
    .replace(/[_\-.]/g, " ")
    .replace(/[^a-z0-9 ]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function guessColumnMapping(headers: string[]): Record<string, string> {
  const normalisedHeaders = headers.map((h) => ({ raw: h, normalised: normalise(h) }));
  const used = new Set<string>();
  const mapping: Record<string, string> = {};

  for (const fieldKey of FIELD_PRIORITY) {
    const keywords = FIELD_KEYWORDS[fieldKey];
    // Exact match first (e.g. header is literally "Phone Number"), then
    // fall back to "header contains this keyword" for looser sheets.
    let match = normalisedHeaders.find((h) => !used.has(h.raw) && keywords.includes(h.normalised));
    if (!match) {
      match = normalisedHeaders.find(
        (h) => !used.has(h.raw) && keywords.some((k) => h.normalised.includes(k)),
      );
    }
    if (match) {
      mapping[fieldKey] = match.raw;
      used.add(match.raw);
    }
  }

  return mapping;
}
