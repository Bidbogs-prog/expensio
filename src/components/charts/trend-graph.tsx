"use client";

// recharts-only render tree for the cash-flow trend, split for code-splitting.

import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { TrendPoint } from "@/lib/insights";

function TrendTooltip({
  active,
  payload,
  label,
  currency,
}: {
  active?: boolean;
  payload?: { payload: TrendPoint }[];
  label?: string;
  currency: string;
}) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="rounded-lg border border-border bg-popover/95 p-3 shadow-medium backdrop-blur">
      <p className="mb-1.5 text-xs font-semibold">{label}</p>
      <div className="space-y-0.5 text-xs">
        <p className="flex items-center justify-between gap-4">
          <span className="text-emerald-400">Income</span>
          <span className="font-mono tabular">{d.income.toLocaleString()} {currency}</span>
        </p>
        <p className="flex items-center justify-between gap-4">
          <span className="text-rose-400">Expenses</span>
          <span className="font-mono tabular">{d.expense.toLocaleString()} {currency}</span>
        </p>
        <p className="flex items-center justify-between gap-4 border-t border-border pt-1">
          <span className="text-muted-foreground">Net</span>
          <span className="font-mono tabular font-semibold">{d.net.toLocaleString()} {currency}</span>
        </p>
      </div>
    </div>
  );
}

export function TrendGraph({
  data,
  currency,
}: {
  data: TrendPoint[];
  currency: string;
}) {
  return (
    <ResponsiveContainer width="99%" height={260}>
      <AreaChart data={data} margin={{ top: 8, right: 6, left: -18, bottom: 0 }}>
        <defs>
          <linearGradient id="gExpense" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="hsl(var(--chart-5))" stopOpacity={0.5} />
            <stop offset="100%" stopColor="hsl(var(--chart-5))" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="gIncome" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.45} />
            <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
          </linearGradient>
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
        <Tooltip content={<TrendTooltip currency={currency} />} cursor={{ stroke: "hsl(var(--border))" }} />
        <Area type="monotone" dataKey="income" stroke="hsl(var(--primary))" strokeWidth={2} fill="url(#gIncome)" />
        <Area type="monotone" dataKey="expense" stroke="hsl(var(--chart-5))" strokeWidth={2} fill="url(#gExpense)" />
        <Line type="monotone" dataKey="net" stroke="hsl(var(--chart-2))" strokeWidth={1.5} strokeDasharray="4 3" dot={false} />
      </AreaChart>
    </ResponsiveContainer>
  );
}
