"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { LogOut, User } from "lucide-react";
import { signOut } from "@/lib/actions/auth";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import type { Profile } from "@/lib/auth/current-profile";

const ROLE_LABEL: Record<string, string> = {
  super_admin: "Super admin",
  ops_manager: "Ops manager",
  team_lead: "Team lead",
  qa: "QA",
  agent: "Agent",
  client_viewer: "Client",
};

function initials(name: string) {
  return name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

const TITLES: Record<string, string> = {
  workspace: "Dial workspace",
  admin: "Live floor",
  performance: "Performance",
  people: "People",
  campaigns: "Campaigns",
  attendance: "Attendance",
  compliance: "Compliance",
  data: "Data",
  security: "Security & audit",
  client: "Client reports",
  qa: "QA queue",
};

function useTitle() {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);
  const last = segments[segments.length - 1] ?? "admin";
  return TITLES[last] ?? "ABPO Command";
}

export function Header({ profile }: { profile: Profile }) {
  const title = useTitle();
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <header className="flex h-12 shrink-0 items-center justify-between border-b border-line bg-white px-4">
      <div className="flex items-center gap-2">
        <h1 className="text-sm font-semibold text-ink">{title}</h1>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1.5 text-xs">
          <span className="tabular text-muted">{profile.timezone}</span>
          <span className="tabular font-medium text-ink">
            {now
              ? now.toLocaleTimeString("en-GB", {
                  timeZone: profile.timezone,
                  hour: "2-digit",
                  minute: "2-digit",
                  second: "2-digit",
                })
              : "--:--:--"}
          </span>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger className="flex items-center gap-2 rounded-md px-1.5 py-1 hover:bg-canvas cursor-pointer">
            <Avatar className="h-7 w-7">
              <AvatarFallback>{initials(profile.full_name)}</AvatarFallback>
            </Avatar>
            <div className="hidden text-left sm:block">
              <div className="text-xs font-medium leading-tight text-ink">{profile.full_name}</div>
              <div className="text-[10px] leading-tight text-muted">
                {profile.agent_code ?? ROLE_LABEL[profile.role]}
              </div>
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel className="flex items-center gap-2 normal-case">
              <User className="h-3.5 w-3.5" />
              {profile.full_name}
              <Badge variant="blue">{ROLE_LABEL[profile.role]}</Badge>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              variant="danger"
              onSelect={() => {
                void signOut();
              }}
            >
              <LogOut className="mr-2 h-3.5 w-3.5" /> Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
