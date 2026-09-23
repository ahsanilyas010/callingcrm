// Shared fabricated data for every /demo/ops/* tab — kept in one place so
// the same fake campaign/people names show up consistently across tabs,
// the way real ones would. Nothing here is queried from anywhere.

export const DUMMY_CAMPAIGNS = [
  {
    name: "Meridian Home Services",
    code: "MHS-01",
    market: "US",
    isActive: true,
    audience: "b2c",
    vertical: "home services",
    riskTier: "standard",
    client: "Meridian Group",
    assignedAgents: 6,
  },
  {
    name: "Northgate Insurance Group",
    code: "NIG-02",
    market: "UK",
    isActive: true,
    audience: "b2c",
    vertical: "insurance",
    riskTier: "elevated",
    client: "Northgate Holdings",
    assignedAgents: 5,
  },
  {
    name: "Vantage Solar Solutions",
    code: "VSS-03",
    market: "US",
    isActive: false,
    audience: "b2c",
    vertical: "solar",
    riskTier: "standard",
    client: "Vantage Energy",
    assignedAgents: 2,
  },
];

export const DUMMY_CLIENTS = [
  { name: "Meridian Group", country: "US", email: "ops@meridiangroup.example", isController: true, dpaSigned: "2026-02-14" },
  { name: "Northgate Holdings", country: "GB", email: "compliance@northgate.example", isController: true, dpaSigned: "2026-01-03" },
  { name: "Vantage Energy", country: "US", email: null, isController: false, dpaSigned: null },
];

export const DUMMY_PEOPLE = [
  { name: "Aiden Brooks", role: "team_lead", team: "Team Falcon", agentCode: "AGT-201", active: true, mustSetPassword: false, lastLogin: "2 hours ago" },
  { name: "Priya Sharma", role: "agent", team: "Team Falcon", agentCode: "AGT-205", active: true, mustSetPassword: false, lastLogin: "40 minutes ago" },
  { name: "Marcus Webb", role: "agent", team: "Team Falcon", agentCode: "AGT-207", active: true, mustSetPassword: true, lastLogin: "Never" },
  { name: "Lena Ortiz", role: "qa", team: "—", agentCode: "QA-010", active: true, mustSetPassword: false, lastLogin: "1 day ago" },
  { name: "Sofia Reyes", role: "agent", team: "Team Kestrel", agentCode: "AGT-312", active: false, mustSetPassword: false, lastLogin: "5 days ago" },
];

export const ROLE_LABEL: Record<string, string> = {
  super_admin: "Super admin",
  ops_manager: "Ops manager",
  team_lead: "Team lead",
  qa: "QA",
  agent: "Agent",
};
