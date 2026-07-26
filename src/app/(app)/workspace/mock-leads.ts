export interface MockLead {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  city: string;
  region: string;
  propertyType: string;
  project: string;
  source: string;
  screenedDaysAgo: number;
  localTime: string;
  inWindow: boolean;
  attempt: number;
  maxAttempts: number;
}

export const MOCK_QUEUE: MockLead[] = [
  {
    id: "1",
    firstName: "J.",
    lastName: "Harper",
    phone: "+44 7700 900123",
    city: "Bristol",
    region: "BS1",
    propertyType: "Detached",
    project: "Loft conversion",
    source: "Bristol CC planning",
    screenedDaysAgo: 4,
    localTime: "14:12",
    inWindow: true,
    attempt: 2,
    maxAttempts: 6,
  },
  {
    id: "2",
    firstName: "M.",
    lastName: "Osei",
    phone: "+44 7911 123456",
    city: "Leeds",
    region: "LS6",
    propertyType: "Semi-detached",
    project: "Extension",
    source: "Barbour ABI",
    screenedDaysAgo: 11,
    localTime: "14:13",
    inWindow: true,
    attempt: 1,
    maxAttempts: 6,
  },
  {
    id: "3",
    firstName: "R.",
    lastName: "Fitzgerald",
    phone: "+1 512 555 0142",
    city: "Austin",
    region: "TX",
    propertyType: "Single family",
    project: "Roof replacement",
    source: "Austin TX permits",
    screenedDaysAgo: 2,
    localTime: "03:14",
    inWindow: false,
    attempt: 1,
    maxAttempts: 6,
  },
];

export interface MockDisposition {
  code: string;
  label: string;
  requiresNote: boolean;
  requiresFollowup: boolean;
  setsDnc?: boolean;
}

export const DISPOSITIONS: MockDisposition[] = [
  { code: "connected_interested", label: "Connected — Interested", requiresNote: false, requiresFollowup: true },
  { code: "connected_callback", label: "Connected — Callback Requested", requiresNote: false, requiresFollowup: true },
  { code: "connected_not_interested", label: "Connected — Not Interested", requiresNote: false, requiresFollowup: false },
  { code: "connected_dnc", label: "Connected — Do Not Call", requiresNote: true, requiresFollowup: false, setsDnc: true },
  { code: "connected_wrong_person", label: "Connected — Wrong Person", requiresNote: false, requiresFollowup: false },
  { code: "connected_wrong_number", label: "Connected — Wrong Number", requiresNote: false, requiresFollowup: false },
  { code: "no_answer", label: "No Answer", requiresNote: false, requiresFollowup: false },
  { code: "voicemail", label: "Voicemail", requiresNote: false, requiresFollowup: false },
  { code: "invalid_number", label: "Invalid Number", requiresNote: false, requiresFollowup: false },
];
