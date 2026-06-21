"use client";

import { useMemo } from "react";
import dynamic from "next/dynamic";
import { Lock, TrendingUp } from "lucide-react";
import { Card } from "@/components/ui/card";
import { useTransactions, useCurrency } from "@/lib/queries";
import { useCurrentMonth } from "@/hooks/use-derived";
import { computeTrend } from "@/lib/insights";
import { usePlan } from "@/lib/plan";

// Code-split recharts out of the initial bundle.
const TrendGraph = dynamic(
  () => import("@/components/charts/trend-graph").then((m) => m.TrendGraph),
  {
    ssr: false,
    loading: () => <div className="h-[260px] w-full animate-pulse rounded-xl bg-muted/40" />,
  }
);

export function SpendingTrend() {
  const { isPro, openUpgrade } = usePlan();
  const { data: expenses } = useTransactions("expense");
  const { data: income } = useTransactions("income");
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
        {!isPro && (
          <span className="rounded-full border border-primary/30 bg-primary/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-primary">
            Pro
          </span>
        )}
      </div>

      <div className="relative h-[260px] w-full">
        <div className={!isPro ? "pointer-events-none select-none blur-[6px] saturate-50" : undefined}>
          <TrendGraph data={data} currency={currency} />
        </div>

        {!isPro && (
          <button
            onClick={() => openUpgrade("trend analytics")}
            className="absolute inset-0 flex flex-col items-center justify-center gap-3 rounded-lg"
          >
            <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/15 text-primary ring-1 ring-primary/25">
              <Lock className="h-5 w-5" />
            </span>
            <div className="text-center">
              <p className="text-sm font-semibold">Trend analytics is a Pro feature</p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                See 6-month cash-flow & forecasts.
              </p>
            </div>
            <span className="rounded-full bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground glow-primary">
              Unlock with Pro
            </span>
          </button>
        )}
      </div>
    </Card>
  );
}
