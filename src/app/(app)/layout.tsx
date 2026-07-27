import { requireProfile } from "@/lib/auth/current-profile";
import { navFor } from "@/lib/nav";
import { getCurrentSession } from "@/lib/actions/attendance";
import { getMyFollowups } from "@/lib/actions/followups";
import { AppChrome } from "@/components/shell/app-chrome";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const profile = await requireProfile();
  const items = navFor(profile.role);
  const [session, followups] = await Promise.all([getCurrentSession(), getMyFollowups()]);

  return (
    <AppChrome profile={profile} initialSession={session} initialFollowups={followups} items={items}>
      {children}
    </AppChrome>
  );
}
