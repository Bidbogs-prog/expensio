"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/page-header";
import { CurrencySelect } from "@/components/currency-select";
import { MonthNavigator } from "@/components/monthNavigator";
import { ScopeSwitcher } from "@/components/scope-switcher";
import { InsightsPanel } from "@/components/insights-panel";
import { SpendingTrend } from "@/components/spending-trend";
import { CategoryPieChart } from "@/components/category-pie-chart";
import { useGroups } from "@/lib/group-queries";
import { useRealtimeLedger } from "@/hooks/use-realtime-ledger";

export default function InsightsPage() {
  const { data: groups = [] } = useGroups();
  const [scope, setScope] = useState<string | null>(null); // null = personal

  // Keep the scope valid if the user's groups change (e.g. leaves a group).
  useEffect(() => {
    if (scope && !groups.some((g) => g.id === scope)) setScope(null);
  }, [groups, scope]);

  // Live household updates while viewing a shared budget's insights.
  useRealtimeLedger(!!scope);

  const isPersonal = scope === null;

  return (
    <div className="min-h-screen">
      <PageHeader
        eyebrow="Expensio AI"
        title="Insights"
        subtitle={
          isPersonal
            ? "Live analysis of your spending"
            : "Live analysis of your household"
        }
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

        {/* Personal | Family scope toggle — same control as the other tabs. */}
        {groups.length > 0 && (
          <ScopeSwitcher groups={groups} value={scope} onChange={setScope} />
        )}

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
          <InsightsPanel variant="full" groupId={scope} className="lg:col-span-3" />
          <div className="space-y-4 lg:col-span-2">
            <SpendingTrend groupId={scope} />
          </div>
        </div>

        <div>
          <h2 className="mb-3 font-display text-lg font-bold tracking-tight">Where it goes</h2>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <CategoryPieChart kind="expense" groupId={scope} />
            <CategoryPieChart kind="income" groupId={scope} />
          </div>
        </div>
      </div>
    </div>
  );
}
