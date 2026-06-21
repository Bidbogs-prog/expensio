"use client";

import dynamic from "next/dynamic";
import { PieChart as PieIcon } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useCurrency } from "@/lib/queries";
import { useMonthTransactions, useMonthTotals, useCurrentMonth } from "@/hooks/use-derived";
import {
  TX_CONFIG,
  colorForCategory,
  formatCategory,
  type TxKind,
} from "@/lib/transaction-ui";
import type { SliceDatum } from "@/components/charts/pie-graph";

// recharts is heavy (~tens of KB) — load it only when a chart actually renders,
// keeping it out of the initial route bundle.
const PieGraph = dynamic(
  () => import("@/components/charts/pie-graph").then((m) => m.PieGraph),
  {
    ssr: false,
    loading: () => <div className="h-full w-full animate-pulse rounded-xl bg-muted/40" />,
  }
);

export function CategoryPieChart({ kind }: { kind: TxKind }) {
  const cfg = TX_CONFIG[kind];
  const isExpense = kind === "expense";

  const currency = useCurrency();
  const currentMonth = useCurrentMonth();
  const totals = useMonthTotals();
  const items = useMonthTransactions(kind);

  const total = isExpense ? totals.expenseTotal : totals.incomeTotal;

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
            <CardTitle className="font-display text-base font-bold tracking-tight">
              {cfg.title} breakdown
            </CardTitle>
            <CardDescription className="font-mono text-xs tabular">
              {monthLabel} · {total.toLocaleString()} {currency}
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
            <PieGraph chartData={chartData} currency={currency} />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
