"use client";

import { useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { BarChart3, ChevronLeft, ChevronRight, PiggyBank, TrendingDown, TrendingUp, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/page-header";
import { CurrencySelect } from "@/components/currency-select";
import { ScopeSwitcher } from "@/components/scope-switcher";
import { StatCard } from "@/components/stat-card";
import { useGroups } from "@/lib/group-queries";
import { useCurrency, useSavingsContributions, useScopedTransactions } from "@/lib/queries";
import { computeTrend } from "@/lib/insights";
import { TX_CONFIG, colorForCategory, formatCategory } from "@/lib/transaction-ui";

// Code-split recharts out of the initial bundle.
const TrendGraph = dynamic(
  () => import("@/components/charts/trend-graph").then((m) => m.TrendGraph),
  {
    ssr: false,
    loading: () => <div className="h-[260px] w-full animate-pulse rounded-xl bg-muted/40" />,
  }
);

export default function ReportsPage() {
  const currency = useCurrency();
  const { data: groups = [] } = useGroups();
  const [scope, setScope] = useState<string | null>(null); // null = personal

  const { data: expenses = [] } = useScopedTransactions("expense", scope);
  const { data: income = [] } = useScopedTransactions("income", scope);
  const { data: contributions = [] } = useSavingsContributions(scope);

  const thisYear = new Date().getFullYear();
  const [year, setYear] = useState(thisYear);

  const minYear = useMemo(() => {
    const years = [...expenses, ...income]
      .map((t) => Number(t.date?.slice(0, 4)))
      .filter((y) => Number.isFinite(y) && y > 1970);
    return years.length ? Math.min(...years) : thisYear;
  }, [expenses, income, thisYear]);

  const trend = useMemo(
    () => computeTrend(expenses, income, `${year}-12`, 12, contributions),
    [expenses, income, year, contributions]
  );

  const inYear = useMemo(() => {
    const prefix = String(year);
    return (t: { date?: string }) => t.date?.startsWith(prefix);
  }, [year]);
  const yearExpenses = useMemo(() => expenses.filter(inYear), [expenses, inYear]);
  const yearIncome = useMemo(() => income.filter(inYear), [income, inYear]);
  const sum = (items: { amount: number }[]) =>
    items.reduce((s, t) => s + Number(t.amount), 0);

  const totalExpense = sum(yearExpenses);
  const totalIncome = sum(yearIncome);
  const totalSaved = sum(contributions.filter(inYear));
  const net = totalIncome - totalExpense - totalSaved;

  const categoryTotals = useMemo(() => {
    const map = new Map<string, number>();
    for (const t of yearExpenses) {
      map.set(t.category, (map.get(t.category) ?? 0) + Number(t.amount));
    }
    return [...map.entries()].sort((a, b) => b[1] - a[1]);
  }, [yearExpenses]);
  const maxCategory = categoryTotals[0]?.[1] ?? 0;

  return (
    <div className="min-h-screen">
      <PageHeader eyebrow="Analysis" title="Reports" subtitle="Your year at a glance">
        <CurrencySelect />
      </PageHeader>

      <div className="mx-auto w-full max-w-6xl space-y-6 px-4 py-6 sm:px-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {groups.length > 0 ? (
            <ScopeSwitcher groups={groups} value={scope} onChange={setScope} />
          ) : (
            <span />
          )}
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => setYear((y) => y - 1)}
              disabled={year <= minYear}
              aria-label="Previous year"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="min-w-[4.5rem] text-center font-display text-lg font-bold tabular">
              {year}
            </span>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => setYear((y) => y + 1)}
              disabled={year >= thisYear}
              aria-label="Next year"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          <StatCard
            label="Income"
            value={Math.round(totalIncome)}
            unit={currency}
            icon={TrendingUp}
            tone="positive"
            hint={<span className="text-xs text-muted-foreground">{year} total</span>}
          />
          <StatCard
            label="Expenses"
            value={Math.round(totalExpense)}
            unit={currency}
            icon={TrendingDown}
            tone="negative"
            hint={<span className="text-xs text-muted-foreground">{year} total</span>}
          />
          <StatCard
            label="Saved"
            value={Math.round(totalSaved)}
            unit={currency}
            icon={PiggyBank}
            tone="positive"
            hint={<span className="text-xs text-muted-foreground">Moved to goals</span>}
          />
          <StatCard
            label="Net"
            value={Math.round(net)}
            unit={currency}
            icon={Wallet}
            tone={net < 0 ? "negative" : "positive"}
            hint={
              <span className="text-xs text-muted-foreground">
                Income − expenses − saved
              </span>
            }
          />
        </div>

        <Card className="relative overflow-hidden p-5 shadow-soft">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/15 text-primary ring-1 ring-primary/20">
                <BarChart3 className="h-[1.05rem] w-[1.05rem]" />
              </span>
              <div>
                <h2 className="font-display text-base font-bold leading-none tracking-tight">
                  Monthly cash flow
                </h2>
                <p className="mt-1 text-xs text-muted-foreground">Jan – Dec {year}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              {[
                { label: "Income", color: "hsl(var(--primary))" },
                { label: "Expenses", color: "hsl(var(--chart-5))" },
                { label: "Savings", color: "hsl(var(--chart-3))" },
              ].map((s) => (
                <span key={s.label} className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full" style={{ background: s.color }} />
                  {s.label}
                </span>
              ))}
            </div>
          </div>
          <div className="relative h-[260px] w-full">
            <TrendGraph data={trend} currency={currency} />
          </div>
        </Card>

        <Card className="p-5 shadow-soft">
          <h2 className="font-display text-base font-bold leading-none tracking-tight">
            Spending by category
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">
            {categoryTotals.length} categor{categoryTotals.length === 1 ? "y" : "ies"} in {year}
          </p>

          {categoryTotals.length === 0 ? (
            <p className="mt-4 rounded-lg border border-dashed border-border/60 px-3 py-6 text-center text-sm text-muted-foreground">
              No expenses recorded in {year}.
            </p>
          ) : (
            <ul className="mt-4 space-y-3">
              {categoryTotals.map(([cat, amount]) => {
                const color = colorForCategory(cat, TX_CONFIG.expense.palette);
                const share = totalExpense > 0 ? amount / totalExpense : 0;
                return (
                  <li key={cat}>
                    <div className="mb-1 flex items-center justify-between gap-2 text-sm">
                      <span className="flex items-center gap-2 font-medium">
                        <span
                          className="h-2 w-2 rounded-full"
                          style={{ background: color }}
                        />
                        {formatCategory(cat)}
                      </span>
                      <span className="font-mono text-xs tabular text-muted-foreground">
                        {amount.toLocaleString()} {currency} · {Math.round(share * 100)}%
                      </span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${maxCategory > 0 ? (amount / maxCategory) * 100 : 0}%`,
                          background: color,
                        }}
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}
