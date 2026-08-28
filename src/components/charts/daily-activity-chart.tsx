"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export function DailyActivityChart({
  label,
  data,
  valueLabel,
}: {
  label: string;
  data: { day: string; value: number }[];
  valueLabel: string;
}) {
  return (
    <div>
      <p className="mb-2 text-xs font-medium text-ink">{label}</p>
      <div className="h-[180px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ left: 0, right: 8, top: 4, bottom: 4 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-line)" />
            <XAxis
              dataKey="day"
              fontSize={10}
              tickLine={false}
              axisLine={false}
              tickFormatter={(d: string) => d.slice(5)}
            />
            <YAxis fontSize={10} tickLine={false} axisLine={false} width={28} />
            <Tooltip
              cursor={{ fill: "var(--color-canvas)" }}
              contentStyle={{ fontSize: 12, borderRadius: 8, borderColor: "var(--color-line)" }}
              formatter={(value) => [value, valueLabel]}
            />
            <Bar dataKey="value" fill="var(--color-brand-blue)" radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
