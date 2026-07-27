import { Building2 } from "lucide-react";
import { PhasePlaceholder } from "@/components/shell/phase-placeholder";

export default function ClientReportsPage() {
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
