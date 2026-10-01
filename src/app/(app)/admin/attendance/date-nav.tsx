"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

function shiftDate(date: string, days: number) {
  const d = new Date(`${date}T00:00:00.000Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

// Prev/next-day navigation for a single `date` searchParam — used by the
// muster tab so a manager can look at any past day's clock-ins, not just
// today's.
export function DateNav({ date, paramKey = "date" }: { date: string; paramKey?: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function go(next: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set(paramKey, next);
    router.push(`${pathname}?${params.toString()}`);
  }

  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="flex items-center gap-1.5">
      <Button variant="secondary" size="icon" onClick={() => go(shiftDate(date, -1))} aria-label="Previous day">
        <ChevronLeft className="h-3.5 w-3.5" />
      </Button>
      <Input
        type="date"
        value={date}
        onChange={(e) => e.target.value && go(e.target.value)}
        className="w-[150px]"
      />
      <Button variant="secondary" size="icon" onClick={() => go(shiftDate(date, 1))} aria-label="Next day">
        <ChevronRight className="h-3.5 w-3.5" />
      </Button>
      {date !== today && (
        <Button variant="ghost" size="sm" onClick={() => go(today)}>
          Today
        </Button>
      )}
    </div>
  );
}

// From/to range picker for the history tab, with quick 7d/30d presets.
export function DateRangeNav({ from, to }: { from: string; to: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function apply(nextFrom: string, nextTo: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("from", nextFrom);
    params.set("to", nextTo);
    router.push(`${pathname}?${params.toString()}`);
  }

  function preset(days: number) {
    const todayStr = new Date().toISOString().slice(0, 10);
    apply(shiftDate(todayStr, -(days - 1)), todayStr);
  }

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <Input type="date" value={from} onChange={(e) => e.target.value && apply(e.target.value, to)} className="w-[150px]" />
      <span className="text-xs text-muted">to</span>
      <Input type="date" value={to} onChange={(e) => e.target.value && apply(from, e.target.value)} className="w-[150px]" />
      <Button variant="secondary" size="sm" onClick={() => preset(7)}>
        Last 7d
      </Button>
      <Button variant="secondary" size="sm" onClick={() => preset(30)}>
        Last 30d
      </Button>
    </div>
  );
}
