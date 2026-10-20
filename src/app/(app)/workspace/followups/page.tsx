import { redirect } from "next/navigation";
import { requireProfile } from "@/lib/auth/current-profile";
import { getMyFollowupsFull } from "@/lib/actions/followups";
import { FollowupsTable } from "./followups-table";

// Any staff role can end up with assigned follow-ups (the sweep job
// escalates a missed+unescalated one to the agent's team lead), same as
// the tray itself has no role gate — this just restricts the nav entry to
// agents (src/lib/nav.ts), not who can load the page.
export default async function FollowupsPage() {
  const profile = await requireProfile();
  if (!["agent", "team_lead", "ops_manager", "super_admin"].includes(profile.role)) redirect("/");

  // Full history, not the tray's pending/snoozed-only, 20-row slice — this
  // page is the actual management surface.
  const rows = await getMyFollowupsFull({});

  return (
    <div className="p-4">
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-ink">Follow-ups</h2>
        <p className="text-xs text-muted">
          {rows.length} follow-up{rows.length === 1 ? "" : "s"} assigned to you, every status — the bell
          icon only ever shows what&rsquo;s pending or snoozed.
        </p>
      </div>

      <FollowupsTable rows={rows} />
    </div>
  );
}
