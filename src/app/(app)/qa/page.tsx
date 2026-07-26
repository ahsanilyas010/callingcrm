import { ShieldCheck } from "lucide-react";
import { PhasePlaceholder } from "@/components/shell/phase-placeholder";

export default function QaQueuePage() {
  return (
    <PhasePlaceholder
      icon={ShieldCheck}
      title="QA queue"
      phase="Phase 6"
      description="Scorecards and reviews need call_attempts to review — that lands with the agent workspace."
      bullets={[
        "Fatal-breach criteria: opening disclosure, identity, opt-out honoured, no false claims",
        "Agent acknowledgement of coaching notes",
        "10% mandatory sampling on high-risk-tier campaigns",
      ]}
    />
  );
}
