"use client";

import { AlertTriangle } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { CurrencySelect } from "@/components/currency-select";
import { MonthNavigator } from "@/components/monthNavigator";
import { TransactionWorkspace } from "@/components/transaction-workspace";
import { Card } from "@/components/ui/card";
import { useUiStore } from "@/hooks/use-ui-store";

export default function IncomePage() {
  const error = useUiStore((s) => s.error);

  return (
    <div className="min-h-screen">
      <PageHeader eyebrow="Earnings" title="Income" subtitle="Track and manage your income sources">
        <div className="hidden sm:block">
          <MonthNavigator />
        </div>
        <CurrencySelect />
      </PageHeader>

      <div className="mx-auto w-full max-w-6xl space-y-6 px-4 py-6 sm:px-6">
        <div className="flex justify-center sm:hidden">
          <MonthNavigator />
        </div>

        {error && (
          <Card className="flex items-center gap-3 border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
            <AlertTriangle className="h-5 w-5 shrink-0" />
            {error}
          </Card>
        )}

        <TransactionWorkspace kind="income" />
      </div>
    </div>
  );
}
