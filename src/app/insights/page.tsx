"use client";

import { PageHeader } from "@/components/page-header";
import { CurrencySelect } from "@/components/currency-select";
import { MonthNavigator } from "@/components/monthNavigator";
import { InsightsPanel } from "@/components/insights-panel";
import { SpendingTrend } from "@/components/spending-trend";
import { CategoryPieChart } from "@/components/category-pie-chart";

export default function InsightsPage() {
  return (
    <div className="min-h-screen">
      <PageHeader
        eyebrow="Expensio AI"
        title="Insights"
        subtitle="Live analysis of your spending"
      >
        <div className="hidden sm:block">
          <MonthNavigator />
        </div>
        <CurrencySelect />
      </PageHeader>

      <div className="mx-auto w-full max-w-6xl space-y-6 px-4 py-6 sm:px-6">
        <div className="flex justify-center sm:hidden">
          <MonthNavigator />
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
          <InsightsPanel variant="full" className="lg:col-span-3" />
          <div className="space-y-4 lg:col-span-2">
            <SpendingTrend />
          </div>
        </div>

        <div>
          <h2 className="mb-3 font-display text-lg font-bold tracking-tight">Where it goes</h2>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <CategoryPieChart kind="expense" />
            <CategoryPieChart kind="income" />
          </div>
        </div>
      </div>
    </div>
  );
}
