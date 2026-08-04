"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export function FunnelChart({
  label,
  data,
}: {
  label: string;
  data: { stage: string; value: number }[];
}) {
  return (
    <div>
      <p className="mb-2 text-xs font-medium text-ink">{label}</p>
      <div className="h-[220px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ left: 8, right: 16, top: 4, bottom: 4 }}>
            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--color-line)" />
            <XAxis type="number" fontSize={11} tickLine={false} axisLine={false} />
            <YAxis
              type="category"
              dataKey="stage"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              width={80}
            />
            <Tooltip
              cursor={{ fill: "var(--color-canvas)" }}
              contentStyle={{ fontSize: 12, borderRadius: 8, borderColor: "var(--color-line)" }}
            />
            <Bar dataKey="value" fill="var(--color-brand-blue)" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
