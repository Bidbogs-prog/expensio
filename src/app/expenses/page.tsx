"use client";

import { AlertTriangle } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { CurrencySelect } from "@/components/currency-select";
import { MonthNavigator } from "@/components/monthNavigator";
import { TransactionForm } from "@/components/transaction-form";
import { TransactionTable } from "@/components/transaction-table";
import { Card } from "@/components/ui/card";
import { useUiStore } from "@/hooks/use-ui-store";

export default function ExpensesPage() {
  const error = useUiStore((s) => s.error);

  return (
    <div className="min-h-screen">
      <PageHeader eyebrow="Spending" title="Expenses" subtitle="Track and manage your spending">
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

        <Card className="p-4 shadow-soft sm:p-6">
          <TransactionForm kind="expense" />
        </Card>

        <TransactionTable kind="expense" />
      </div>
    </div>
  );
}
