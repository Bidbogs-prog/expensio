"use client";

// recharts-only render tree, split out so it can be code-split via next/dynamic
// and kept out of the initial route bundle.

import { PieChart, Pie, ResponsiveContainer, Cell, Legend, Tooltip } from "recharts";

export interface SliceDatum {
  category: string;
  amount: number;
  fill: string;
  percentage: number;
}

function ChartTooltip({
  active,
  payload,
  currency,
}: {
  active?: boolean;
  payload?: { payload: SliceDatum }[];
  currency: string;
}) {
  if (!active || !payload?.length) return null;
  const data = payload[0].payload;
  return (
    <div className="rounded-lg border bg-popover p-3 text-popover-foreground shadow-medium">
      <p className="text-sm font-semibold">{data.category}</p>
      <p className="font-mono text-sm tabular text-muted-foreground">
        {data.amount.toLocaleString()} {currency}
      </p>
      <p className="text-xs text-muted-foreground">
        {data.percentage.toFixed(1)}% of total
      </p>
    </div>
  );
}

export function PieGraph({
  chartData,
  currency,
}: {
  chartData: SliceDatum[];
  currency: string;
}) {
  return (
    <ResponsiveContainer width="99%" height="100%">
      <PieChart>
        <Pie
          data={chartData}
          dataKey="amount"
          nameKey="category"
          cx="50%"
          cy="50%"
          innerRadius="45%"
          outerRadius="65%"
          paddingAngle={2}
          strokeWidth={2}
          stroke="hsl(var(--card))"
        >
          {chartData.map((entry) => (
            <Cell key={entry.category} fill={entry.fill} />
          ))}
        </Pie>
        <Tooltip content={<ChartTooltip currency={currency} />} />
        <Legend
          verticalAlign="bottom"
          height={36}
          iconType="circle"
          formatter={(value, entry) => (
            <span className="text-sm text-foreground">
              {value} ({(entry?.payload as unknown as SliceDatum)?.percentage.toFixed(0)}%)
            </span>
          )}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
