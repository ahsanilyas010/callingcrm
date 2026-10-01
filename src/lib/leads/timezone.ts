// Maps a lead's country_code to the IANA timezone used for call-window
// enforcement (v_dialable_leads). An IANA zone name — not a fixed UTC
// offset — so DST transitions (e.g. UK's BST) are handled automatically
// by Postgres's tzdata forever, not just correct on the day this was written.
//
// Covers the markets this app currently calls into (see campaigns.market).
// Add an entry here before adding a new market's campaigns.
const COUNTRY_TIMEZONE: Record<string, string> = {
  GB: "Europe/London",
  PK: "Asia/Karachi",
  US: "America/New_York",
};

export function timezoneForCountry(countryCode: string | null | undefined): string {
  if (!countryCode) return "UTC";
  return COUNTRY_TIMEZONE[countryCode.toUpperCase()] ?? "UTC";
}
