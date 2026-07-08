"use client";

import { PiggyBank, TrendingDown, TrendingUp, Wallet } from "lucide-react";
import { useCurrency } from "@/lib/queries";
import { useAnalytics, useCurrentMonth } from "@/hooks/use-derived";
import { StatCard } from "@/components/stat-card";
import { CategoryPieChart } from "@/components/category-pie-chart";
import { InsightsPanel } from "@/components/insights-panel";
import { SpendingTrend } from "@/components/spending-trend";

/** The signed-in user's private budget overview (stats, AI, trend, breakdown). */
export function PersonalOverview() {
  const currency = useCurrency();
  const currentMonth = useCurrentMonth();
  const a = useAnalytics();

  const savingsPct = Math.round(a.savingsRate * 100);
  const expensePct = Math.round(a.expenseDelta * 100);

  return (
    <div className="space-y-6">
      {/* Stat row */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatCard
          label="Balance"
          value={Math.round(a.balance)}
          unit={currency}
          icon={Wallet}
          tone={a.balance < 0 ? "negative" : "positive"}
          featured
          beam
          hint={
            a.balance < 0 ? (
              <span className="text-xs font-medium text-rose-400">Over budget</span>
            ) : (
              <span className="text-xs text-muted-foreground">Income − expenses</span>
            )
          }
        />
        <StatCard
          label="Income"
          value={Math.round(a.incomeTotal)}
          unit={currency}
          icon={TrendingUp}
          tone="positive"
          hint={<span className="text-xs text-muted-foreground">{currentMonth.replace("-", " · ")}</span>}
        />
        <StatCard
          label="Expenses"
          value={Math.round(a.expenseTotal)}
          unit={currency}
          icon={TrendingDown}
          tone="negative"
          delta={
            a.prevExpenseTotal > 0
              ? { label: `${Math.abs(expensePct)}%`, positive: a.expenseDelta <= 0 }
              : null
          }
        />
        <StatCard
          label="Savings rate"
          value={a.incomeTotal > 0 ? savingsPct : "—"}
          unit={a.incomeTotal > 0 ? "%" : undefined}
          icon={PiggyBank}
          tone="accent"
          featured
          hint={
            <span className="text-xs text-muted-foreground">
              {savingsPct >= 20 ? "On target" : a.incomeTotal > 0 ? "Aim for 20%" : "Add income"}
            </span>
          }
        />
      </div>

      {/* AI + analytics */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <InsightsPanel variant="compact" />
        <SpendingTrend />
      </div>

      {/* Breakdown */}
      <div>
        <h2 className="mb-3 font-display text-lg font-bold tracking-tight">Breakdown</h2>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <CategoryPieChart kind="expense" />
          <CategoryPieChart kind="income" />
        </div>
      </div>
    </div>
  );
}
