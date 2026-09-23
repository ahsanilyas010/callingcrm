import { redirect } from "next/navigation";
import { requireProfile } from "@/lib/auth/current-profile";
import { DemoAgentView } from "./demo-agent-view";

export default async function DemoAgentPage() {
  const profile = await requireProfile();
  if (profile.role !== "demo_agent") redirect("/");

  return <DemoAgentView />;
}
