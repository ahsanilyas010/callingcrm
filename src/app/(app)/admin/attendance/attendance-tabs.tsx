"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Tabs } from "@/components/ui/tabs";

// Tabs state lives in the URL (?tab=) rather than Tabs' own uncontrolled
// state, because the date pickers on each tab trigger a server round trip
// (new searchParams) that would otherwise remount this page and reset an
// uncontrolled Tabs back to its defaultValue, silently kicking the manager
// off the tab they were looking at.
export function AttendanceTabsRoot({
  children,
  defaultValue,
}: {
  children: React.ReactNode;
  defaultValue: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const value = searchParams.get("tab") ?? defaultValue;

  function onValueChange(next: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", next);
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <Tabs value={value} onValueChange={onValueChange}>
      {children}
    </Tabs>
  );
}
