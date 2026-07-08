"use client";

import { useMemo } from "react";
import dynamic from "next/dynamic";
import { TrendingUp } from "lucide-react";
import { Card } from "@/components/ui/card";
import { useScopedTransactions, useCurrency } from "@/lib/queries";
import { useCurrentMonth } from "@/hooks/use-derived";
import { computeTrend } from "@/lib/insights";

// Code-split recharts out of the initial bundle.
const TrendGraph = dynamic(
  () => import("@/components/charts/trend-graph").then((m) => m.TrendGraph),
  {
    ssr: false,
    loading: () => <div className="h-[260px] w-full animate-pulse rounded-xl bg-muted/40" />,
  }
);

export function SpendingTrend({ groupId = null }: { groupId?: string | null }) {
  const { data: expenses } = useScopedTransactions("expense", groupId);
  const { data: income } = useScopedTransactions("income", groupId);
  const currency = useCurrency();
  const currentMonth = useCurrentMonth();

  const data = useMemo(
    () => computeTrend(expenses ?? [], income ?? [], currentMonth, 6),
    [expenses, income, currentMonth]
  );

  return (
    <Card className="relative overflow-hidden p-5 shadow-soft">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/15 text-primary ring-1 ring-primary/20">
            <TrendingUp className="h-[1.05rem] w-[1.05rem]" />
          </span>
          <div>
            <h2 className="font-display text-base font-bold leading-none tracking-tight">
              Cash-flow trend
            </h2>
            <p className="mt-1 text-xs text-muted-foreground">Last 6 months</p>
          </div>
        </div>
      </div>

      <div className="relative h-[260px] w-full">
        <TrendGraph data={data} currency={currency} />
      </div>
    </Card>
  );
}
