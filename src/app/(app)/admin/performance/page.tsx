import { BarChart3 } from "lucide-react";
import { PhasePlaceholder } from "@/components/shell/phase-placeholder";

export default function PerformancePage() {
  return (
    <PhasePlaceholder
      icon={BarChart3}
      title="Performance"
      phase="Phase 6"
      description="Cross-campaign reporting lands once call_attempts and dispositions exist to report on."
      bullets={[
        "Campaign comparison table with contact/conversion rates",
        "Agent leaderboard — calls per productive hour and QA score by default",
        "Contact-rate heatmap by lead-local hour and weekday",
        "Data source ROI, saved views, weekly digest email",
      ]}
    />
  );
}
