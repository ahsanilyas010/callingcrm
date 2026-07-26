import { requireProfile } from "@/lib/auth/current-profile";
import { navFor } from "@/lib/nav";
import { Sidebar } from "@/components/shell/sidebar";
import { Header } from "@/components/shell/header";
import { PageTransition } from "@/components/shell/page-transition";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const profile = await requireProfile();
  const items = navFor(profile.role);

  return (
    <div className="flex h-screen w-full overflow-hidden">
      <Sidebar items={items} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header profile={profile} />
        <PageTransition>{children}</PageTransition>
      </div>
    </div>
  );
}
