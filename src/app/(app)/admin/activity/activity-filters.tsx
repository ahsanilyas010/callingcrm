"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function ActivityFilters({
  agents,
  campaigns,
  selectedAgent,
  selectedCampaign,
}: {
  agents: { id: string; full_name: string | null }[];
  campaigns: { id: string; name: string; code: string }[];
  selectedAgent: string;
  selectedCampaign: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function set(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value === "all") params.delete(key);
    else params.set(key, value);
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Select value={selectedAgent} onValueChange={(v) => set("agent", v)}>
        <SelectTrigger className="w-44">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All agents</SelectItem>
          {agents.map((a) => (
            <SelectItem key={a.id} value={a.id}>
              {a.full_name ?? "Unnamed agent"}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={selectedCampaign} onValueChange={(v) => set("campaign", v)}>
        <SelectTrigger className="w-52">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All campaigns</SelectItem>
          {campaigns.map((c) => (
            <SelectItem key={c.id} value={c.id}>
              {c.code} — {c.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
