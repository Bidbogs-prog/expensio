"use client";

// recharts-only render tree for cumulative savings growth, split for
// code-splitting. One stacked area per goal, colored with the goal's color.

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { SavingsGoal } from "@/types";
import type { SavingsGrowthPoint } from "@/lib/savings";

type FlatPoint = { label: string; total: number } & Record<string, number | string>;

function GrowthTooltip({
  active,
  payload,
  label,
  goals,
  currency,
}: {
  active?: boolean;
  payload?: { payload: FlatPoint }[];
  label?: string;
  goals: SavingsGoal[];
  currency: string;
}) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="rounded-lg border border-border bg-popover/95 p-3 shadow-medium backdrop-blur">
      <p className="mb-1.5 text-xs font-semibold">{label}</p>
      <div className="space-y-0.5 text-xs">
        {goals.map((g) => (
          <p key={g.id} className="flex items-center justify-between gap-4">
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full" style={{ background: g.color }} />
              {g.name}
            </span>
            <span className="font-mono tabular">
              {Number(d[g.id] ?? 0).toLocaleString()} {currency}
            </span>
          </p>
        ))}
        <p className="flex items-center justify-between gap-4 border-t border-border pt-1">
          <span className="text-muted-foreground">Total saved</span>
          <span className="font-mono tabular font-semibold">
            {d.total.toLocaleString()} {currency}
          </span>
        </p>
      </div>
    </div>
  );
}

export function SavingsGraph({
  data,
  goals,
  currency,
}: {
  data: SavingsGrowthPoint[];
  goals: SavingsGoal[];
  currency: string;
}) {
  const rows: FlatPoint[] = data.map((p) => ({
    label: p.label,
    total: p.total,
    ...p.byGoal,
  }));

  return (
    <ResponsiveContainer width="99%" height={260}>
      <AreaChart data={rows} margin={{ top: 8, right: 6, left: -18, bottom: 0 }}>
        <defs>
          {goals.map((g) => (
            <linearGradient key={g.id} id={`gGoal-${g.id}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={g.color} stopOpacity={0.4} />
              <stop offset="100%" stopColor={g.color} stopOpacity={0.05} />
            </linearGradient>
          ))}
        </defs>
        <CartesianGrid stroke="hsl(var(--border))" strokeOpacity={0.5} vertical={false} />
        <XAxis
          dataKey="label"
          tickLine={false}
          axisLine={false}
          tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          width={48}
          tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
          tickFormatter={(v) => (v >= 1000 ? `${v / 1000}k` : `${v}`)}
        />
        <Tooltip
          content={<GrowthTooltip goals={goals} currency={currency} />}
          cursor={{ stroke: "hsl(var(--border))" }}
        />
        {goals.map((g) => (
          <Area
            key={g.id}
            type="monotone"
            stackId="saved"
            dataKey={g.id}
            name={g.name}
            stroke={g.color}
            strokeWidth={2}
            fill={`url(#gGoal-${g.id})`}
          />
        ))}
      </AreaChart>
    </ResponsiveContainer>
  );
}
