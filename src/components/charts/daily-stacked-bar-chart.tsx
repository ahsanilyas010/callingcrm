"use client";

import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

const COLORS = [
  "var(--color-brand-blue)",
  "var(--color-brand-orange)",
  "var(--color-brand-green)",
  "var(--color-warning)",
];

export interface DailyStackedBarSeries {
  key: string;
  label: string;
}

// Unlike FunnelChart/DailyActivityChart (deliberately rendered as pies per
// an earlier explicit call for those two specific charts), a multi-series
// trend over time needs an actual time axis — a pie can't show that. This
// is the first bar chart in the app for exactly that reason.
export function DailyStackedBarChart({
  data,
  series,
}: {
  data: Array<{ day: string } & Record<string, number | string>>;
  series: DailyStackedBarSeries[];
}) {
  const chartData = data.map((d) => ({ ...d, day: d.day.slice(5) }));

  return (
    <div className="h-[260px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 4, right: 8, bottom: 4, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-line)" />
          <XAxis dataKey="day" tick={{ fontSize: 11 }} axisLine={{ stroke: "var(--color-line)" }} />
          <YAxis allowDecimals={false} tick={{ fontSize: 11 }} axisLine={{ stroke: "var(--color-line)" }} />
          <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, borderColor: "var(--color-line)" }} />
          <Legend wrapperStyle={{ fontSize: 11 }} />
          {series.map((s, i) => (
            <Bar key={s.key} dataKey={s.key} name={s.label} stackId="a" fill={COLORS[i % COLORS.length]} radius={i === series.length - 1 ? [3, 3, 0, 0] : undefined} />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
