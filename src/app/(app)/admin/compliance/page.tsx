import { ShieldCheck } from "lucide-react";
import { PhasePlaceholder } from "@/components/shell/phase-placeholder";

export default function CompliancePage() {
  return (
    <PhasePlaceholder
      icon={ShieldCheck}
      title="Compliance console"
      phase="Phase 2 / 6"
      description="The screening + suppression console needs the leads and suppression_list tables first — the compliance gate is next up."
      bullets={[
        "Screening status board: passed / expired / unscreened per campaign",
        "Suppression list: search, add, bulk upload, export, with reason",
        "Calling window monitor — should always read zero violations",
        "Retention and evidence vault, exportable for a client or regulator",
      ]}
    />
  );
}
