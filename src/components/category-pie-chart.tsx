"use client";

import { PieChart, Pie, ResponsiveContainer, Cell, Legend, Tooltip } from "recharts";
import { PieChart as PieIcon } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useExpenseStore } from "@/useExpenseStore";
import {
  TX_CONFIG,
  colorForCategory,
  formatCategory,
  type TxKind,
} from "@/lib/transaction-ui";

interface SliceDatum {
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
      <p className="text-sm text-muted-foreground">
        {currency} {data.amount.toLocaleString()}
      </p>
      <p className="text-xs text-muted-foreground">
        {data.percentage.toFixed(1)}% of total
      </p>
    </div>
  );
}

export function CategoryPieChart({ kind }: { kind: TxKind }) {
  const cfg = TX_CONFIG[kind];
  const isExpense = kind === "expense";

  const currency = useExpenseStore((s) => s.currency);
  const expenses = useExpenseStore((s) => s.expenses);
  const income = useExpenseStore((s) => s.currentIncome);
  const currentMonth = useExpenseStore((s) => s.currentMonth);
  const expenseTotal = useExpenseStore((s) => s.ExpenseTotal);
  const incomeTotal = useExpenseStore((s) => s.IncomeTotal);

  const total = isExpense ? expenseTotal : incomeTotal;
  const items = (isExpense ? expenses : income).filter((i) =>
    i.date.startsWith(currentMonth)
  );

  const categoryTotals = new Map<string, number>();
  items.forEach((item) => {
    const amount = Number(item.amount);
    categoryTotals.set(item.category, (categoryTotals.get(item.category) ?? 0) + amount);
  });

  const sum = [...categoryTotals.values()].reduce((s, v) => s + v, 0);
  const chartData: SliceDatum[] = [...categoryTotals]
    .map(([category, amount]) => ({
      category: formatCategory(category),
      amount,
      fill: colorForCategory(category, cfg.palette),
      percentage: sum > 0 ? (amount / sum) * 100 : 0,
    }))
    .sort((a, b) => b.amount - a.amount);

  const monthLabel = new Date(currentMonth + "-02").toLocaleDateString(undefined, {
    month: "long",
    year: "numeric",
  });

  return (
    <Card className="flex flex-col shadow-soft">
      <CardHeader className="pb-2">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              "flex h-9 w-9 items-center justify-center rounded-lg",
              cfg.chipClass
            )}
          >
            <PieIcon className="h-[1.1rem] w-[1.1rem]" />
          </div>
          <div>
            <CardTitle className="text-base">{cfg.title} breakdown</CardTitle>
            <CardDescription>
              {monthLabel} · {currency} {total.toLocaleString()}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-1 pb-6 pt-2">
        {chartData.length === 0 ? (
          <div className="flex h-[300px] flex-col items-center justify-center text-center">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
              <PieIcon className="h-6 w-6" />
            </div>
            <p className="text-sm font-medium text-muted-foreground">
              Nothing to show for {monthLabel}
            </p>
          </div>
        ) : (
          <div className="h-[300px] w-full">
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
          </div>
        )}
      </CardContent>
    </Card>
  );
}
