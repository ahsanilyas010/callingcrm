import { requireProfile } from "@/lib/auth/current-profile";
import { navFor } from "@/lib/nav";
import { getCurrentSession } from "@/lib/actions/attendance";
import { getMyFollowups } from "@/lib/actions/followups";
import { AppChrome } from "@/components/shell/app-chrome";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const profile = await requireProfile();
  const items = navFor(profile.role);
  // Attendance and follow-ups are staff concepts — a client login (or a
  // demo account, which has no real shift or leads either) has nothing
  // real to clock into or follow up on, so skip the queries and let Header
  // hide that chrome entirely for these roles.
  const isStaff = !["client_viewer", "demo_ops", "demo_agent"].includes(profile.role);
  const [session, followups] = isStaff
    ? await Promise.all([getCurrentSession(), getMyFollowups()])
    : [null, []];

  return (
    <AppChrome profile={profile} initialSession={session} initialFollowups={followups} items={items}>
      {children}
    </AppChrome>
  );
}
