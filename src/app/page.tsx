"use client";

import { ArrowDownRight, ArrowUpRight, TrendingDown, Wallet } from "lucide-react";
import { useExpenseStore } from "@/useExpenseStore";
import { PageHeader } from "@/components/page-header";
import { CurrencySelect } from "@/components/currency-select";
import { MonthNavigator } from "@/components/monthNavigator";
import { StatCard } from "@/components/stat-card";
import { CategoryPieChart } from "@/components/category-pie-chart";

export default function Home() {
  const currency = useExpenseStore((s) => s.currency);
  const expenseTotal = useExpenseStore((s) => s.ExpenseTotal);
  const incomeTotal = useExpenseStore((s) => s.IncomeTotal);
  const isBroke = useExpenseStore((s) => s.isBroke);

  const balance = incomeTotal - expenseTotal;
  const fmt = (n: number) => `${n.toLocaleString()} ${currency}`;

  return (
    <div className="min-h-screen">
      <PageHeader title="Dashboard" subtitle="Overview of your finances">
        <CurrencySelect />
      </PageHeader>

      <div className="mx-auto w-full max-w-5xl space-y-6 px-4 py-6 sm:px-6">
        <div className="flex justify-center">
          <MonthNavigator />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <StatCard
            label="Balance"
            value={fmt(balance)}
            icon={Wallet}
            valueClass={
              isBroke
                ? "text-rose-600 dark:text-rose-400"
                : "text-emerald-600 dark:text-emerald-400"
            }
            chipClass={
              isBroke
                ? "bg-rose-100 text-rose-600 dark:bg-rose-500/15 dark:text-rose-400"
                : "bg-emerald-100 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400"
            }
            badge={
              isBroke ? (
                <span className="inline-flex w-fit items-center gap-1 rounded-full bg-rose-100 px-2.5 py-1 text-xs font-medium text-rose-600 dark:bg-rose-500/15 dark:text-rose-400">
                  <ArrowDownRight className="h-3.5 w-3.5" />
                  Spending exceeds income
                </span>
              ) : null
            }
          />

          <StatCard
            label="Income"
            value={fmt(incomeTotal)}
            icon={ArrowUpRight}
            valueClass="text-emerald-600 dark:text-emerald-400"
            chipClass="bg-emerald-100 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400"
          />

          <StatCard
            label="Expenses"
            value={fmt(expenseTotal)}
            icon={TrendingDown}
            valueClass="text-rose-600 dark:text-rose-400"
            chipClass="bg-rose-100 text-rose-600 dark:bg-rose-500/15 dark:text-rose-400"
          />
        </div>

        <div>
          <h2 className="mb-3 text-lg font-semibold">Breakdown</h2>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <CategoryPieChart kind="expense" />
            <CategoryPieChart kind="income" />
          </div>
        </div>
      </div>
    </div>
  );
}
