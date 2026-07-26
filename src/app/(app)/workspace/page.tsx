import { requireProfile } from "@/lib/auth/current-profile";
import { Workspace } from "./workspace";

export default async function WorkspacePage() {
  const profile = await requireProfile();
  return <Workspace agentName={profile.full_name} agentTimezone={profile.timezone} />;
}
