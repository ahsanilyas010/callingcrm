"use client";

import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { AgentActivityCallRow } from "@/lib/reports/agent-activity";

function fmtDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function csvCell(value: string): string {
  return `"${value.replace(/"/g, '""')}"`;
}

function toCsv(rows: AgentActivityCallRow[]): string {
  const header = ["Date/time", "Agent", "Lead", "Phone", "Disposition", "Duration (sec)", "Notes"];
  const lines = [header.map(csvCell).join(",")];
  for (const r of rows) {
    lines.push(
      [
        new Date(r.startedAt).toISOString(),
        r.agentName,
        r.leadName,
        r.phone,
        r.dispositionLabel,
        String(r.durationSeconds),
        r.notes ?? "",
      ]
        .map((v) => csvCell(v))
        .join(","),
    );
  }
  return lines.join("\n");
}

export function CallLogSection({ calls }: { calls: AgentActivityCallRow[] }) {
  function exportCsv() {
    const blob = new Blob([toCsv(calls)], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `agent-activity-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <Card className="animate-slide-up">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Call-by-call log ({calls.length})</CardTitle>
        <Button variant="secondary" size="sm" onClick={exportCsv} disabled={calls.length === 0}>
          <Download className="h-3.5 w-3.5" /> Export CSV
        </Button>
      </CardHeader>
      <CardContent className="p-0">
        <div className="max-h-[520px] overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-canvas">
              <tr className="border-b border-line text-left text-xs text-muted">
                <th className="px-4 py-2 font-medium">Time</th>
                <th className="px-4 py-2 font-medium">Agent</th>
                <th className="px-4 py-2 font-medium">Lead</th>
                <th className="px-4 py-2 font-medium">Phone</th>
                <th className="px-4 py-2 font-medium">Disposition</th>
                <th className="px-4 py-2 font-medium">Duration</th>
                <th className="px-4 py-2 font-medium">Notes</th>
              </tr>
            </thead>
            <tbody>
              {calls.map((c) => (
                <tr key={c.id} className="h-[38px] border-b border-line last:border-0">
                  <td className="px-4 py-1.5 tabular text-xs text-muted">
                    {new Date(c.startedAt).toLocaleString("en-GB", { dateStyle: "short", timeStyle: "short" })}
                  </td>
                  <td className="px-4 py-1.5 text-muted">{c.agentName}</td>
                  <td className="px-4 py-1.5 font-medium text-ink">{c.leadName}</td>
                  <td className="px-4 py-1.5 tabular">{c.phone}</td>
                  <td className="px-4 py-1.5">
                    <Badge variant="warning">{c.dispositionLabel}</Badge>
                  </td>
                  <td className="px-4 py-1.5 tabular text-muted">{fmtDuration(c.durationSeconds)}</td>
                  <td className="max-w-[220px] truncate px-4 py-1.5 text-muted" title={c.notes ?? undefined}>
                    {c.notes ?? "—"}
                  </td>
                </tr>
              ))}
              {calls.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-sm text-muted">
                    No calls in this range.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
