import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DailyStackedBarChart, type DailyStackedBarSeries } from "@/components/charts/daily-stacked-bar-chart";

export interface DailyBreakdownRow {
  day: string;
  [key: string]: string | number;
}

export function DailyBreakdownCard({
  title,
  rows,
  columns,
  emptyMessage = "No activity in this period yet.",
}: {
  title: string;
  rows: DailyBreakdownRow[];
  columns: DailyStackedBarSeries[];
  emptyMessage?: string;
}) {
  const hasData = rows.some((r) => columns.some((c) => Number(r[c.key]) > 0));

  return (
    <Card className="mb-4 animate-slide-up">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {!hasData ? (
          <p className="py-6 text-center text-sm text-muted">{emptyMessage}</p>
        ) : (
          <>
            <DailyStackedBarChart data={rows} series={columns} />
            <div className="mt-4 overflow-x-auto rounded-lg border border-line">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-line bg-canvas text-left text-xs text-muted">
                    <th className="px-3 py-2 font-medium">Date</th>
                    {columns.map((c) => (
                      <th key={c.key} className="px-3 py-2 font-medium">
                        {c.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[...rows].reverse().map((r) => (
                    <tr key={r.day} className="h-[34px] border-b border-line last:border-0">
                      <td className="px-3 py-1.5 tabular text-ink">{r.day}</td>
                      {columns.map((c) => (
                        <td key={c.key} className="px-3 py-1.5 tabular text-muted">
                          {r[c.key]}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
