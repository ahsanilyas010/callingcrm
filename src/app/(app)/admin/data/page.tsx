import { Database } from "lucide-react";
import { PhasePlaceholder } from "@/components/shell/phase-placeholder";

export default function DataPage() {
  return (
    <PhasePlaceholder
      icon={Database}
      title="Data sourcing"
      phase="Phase 7"
      description="Import history, connectors and the evidence vault land after the compliance gate is real."
      bullets={[
        "Bulk import wizard: upload → provenance → map → validate → screen",
        "Connector registry — Companies House, planning/permit feeds, vendor CSV",
        "Rejection reports, row-for-row, downloadable",
        "Scheduled fetch runs and their status",
      ]}
    />
  );
}
