import { Building2 } from "lucide-react";
import { redirect } from "next/navigation";
import { requireProfile } from "@/lib/auth/current-profile";
import { PhasePlaceholder } from "@/components/shell/phase-placeholder";

export default async function ClientReportsPage() {
  // Renders no data today, but guard it now so the role boundary is in
  // place before the real aggregate-only dashboards land here (spec 6.6:
  // "No raw lead PII, ever — enforced by role, not just UI").
  const profile = await requireProfile();
  if (!["client_viewer", "super_admin", "ops_manager"].includes(profile.role)) redirect("/");

  return (
    <PhasePlaceholder
      icon={Building2}
      title="Client reports"
      phase="Phase 6"
      description="Aggregate-only dashboards for client stakeholders — never a lead list, never agent names."
      bullets={[
        "Funnel: loaded → dialable → contacted → qualified → converted",
        "Weekly PDF export with the Assorted logo",
        "No raw lead PII, ever — enforced by role, not just UI",
      ]}
    />
  );
}
