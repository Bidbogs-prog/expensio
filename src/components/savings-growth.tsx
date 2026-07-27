"use client";

import { useMemo } from "react";
import dynamic from "next/dynamic";
import { AreaChart } from "lucide-react";
import { Card } from "@/components/ui/card";
import { useCurrency, useSavingsContributions, useSavingsGoals } from "@/lib/queries";
import { useCurrentMonth } from "@/hooks/use-derived";
import { computeSavingsGrowth } from "@/lib/savings";

// Code-split recharts out of the initial bundle.
const SavingsGraph = dynamic(
  () => import("@/components/charts/savings-graph").then((m) => m.SavingsGraph),
  {
    ssr: false,
    loading: () => <div className="h-[260px] w-full animate-pulse rounded-xl bg-muted/40" />,
  }
);

/** Cumulative saved-so-far, stacked by goal, over the last 6 months. */
export function SavingsGrowth({ groupId = null }: { groupId?: string | null }) {
  const { data: goals = [] } = useSavingsGoals(groupId);
  const { data: contributions = [] } = useSavingsContributions(groupId);
  const currency = useCurrency();
  const currentMonth = useCurrentMonth();

  const data = useMemo(
    () => computeSavingsGrowth(goals, contributions, currentMonth, 6),
    [goals, contributions, currentMonth]
  );

  return (
    <Card className="relative overflow-hidden p-5 shadow-soft">
      <div className="mb-4 flex items-center gap-2.5">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-sky-500/12 text-sky-400 ring-1 ring-sky-500/20">
          <AreaChart className="h-[1.05rem] w-[1.05rem]" />
        </span>
        <div>
          <h2 className="font-display text-base font-bold leading-none tracking-tight">
            Savings growth
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Total set aside, stacked by goal · last 6 months
          </p>
        </div>
      </div>

      <div className="relative h-[260px] w-full">
        <SavingsGraph data={data} goals={goals} currency={currency} />
      </div>
    </Card>
  );
}
