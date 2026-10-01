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

// v_dialable_leads' lead_local_time is a plain Postgres `time` column
// ("14:35:22" or "14:35:22.123456") — not a timestamp — so `new Date(...)`
// on it directly is not a spec-valid date-time string and silently returns
// "Invalid Date" in the browser. Format the HH:MM straight from the string
// instead of round-tripping through Date parsing.
export function formatPgTime(time: string | null | undefined): string | null {
  if (!time) return null;
  const match = time.match(/^(\d{1,2}):(\d{2})/);
  if (!match) return null;
  const hour24 = Number(match[1]);
  const minute = match[2];
  const period = hour24 >= 12 ? "PM" : "AM";
  const hour12 = hour24 % 12 || 12;
  return `${hour12}:${minute} ${period}`;
}
