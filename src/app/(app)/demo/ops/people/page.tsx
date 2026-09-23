import { redirect } from "next/navigation";
import { requireProfile } from "@/lib/auth/current-profile";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { DemoBanner } from "@/components/shell/demo-banner";
import { DemoActionButton } from "../demo-action-button";
import { UserPlus } from "lucide-react";
import { DUMMY_PEOPLE, ROLE_LABEL } from "../dummy-data";

function initials(name: string) {
  return name.split(" ").map((s) => s[0]).slice(0, 2).join("");
}

export default async function DemoPeoplePage() {
  const profile = await requireProfile();
  if (profile.role !== "demo_ops") redirect("/");

  return (
    <div className="p-4">
      <DemoBanner note="This roster is entirely made up — no real staff names, roles, or logins are shown here." />

      <div className="mb-4 flex items-center justify-between">
        <p className="text-xs text-muted">{DUMMY_PEOPLE.length} people · one login per human, no exceptions</p>
        <DemoActionButton>
          <UserPlus className="h-4 w-4" /> Create user
        </DemoActionButton>
      </div>

      <div className="overflow-hidden rounded-lg border border-line bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-line bg-canvas text-left text-xs text-muted">
              <th className="px-3 py-2 font-medium">Name</th>
              <th className="px-3 py-2 font-medium">Role</th>
              <th className="px-3 py-2 font-medium">Team</th>
              <th className="px-3 py-2 font-medium">Agent code</th>
              <th className="px-3 py-2 font-medium">Status</th>
              <th className="px-3 py-2 font-medium">Last login</th>
            </tr>
          </thead>
          <tbody>
            {DUMMY_PEOPLE.map((p) => (
              <tr key={p.name} className="h-[38px] border-b border-line last:border-0 hover:bg-canvas/60">
                <td className="px-3 py-1.5">
                  <div className="flex items-center gap-2">
                    <Avatar className="h-6 w-6">
                      <AvatarFallback className="text-[10px]">{initials(p.name)}</AvatarFallback>
                    </Avatar>
                    <span className="font-medium text-ink">{p.name}</span>
                    {p.mustSetPassword && <Badge variant="warning">Must set password</Badge>}
                  </div>
                </td>
                <td className="px-3 py-1.5">
                  <Badge variant="blue">{ROLE_LABEL[p.role]}</Badge>
                </td>
                <td className="px-3 py-1.5 text-muted">{p.team}</td>
                <td className="px-3 py-1.5 tabular text-muted">{p.agentCode}</td>
                <td className="px-3 py-1.5">
                  {p.active ? <Badge variant="confirm">Active</Badge> : <Badge variant="danger">Deactivated</Badge>}
                </td>
                <td className="px-3 py-1.5 tabular text-xs text-muted">{p.lastLogin}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
