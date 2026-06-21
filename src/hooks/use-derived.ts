// src/hooks/use-derived.ts
// Centralized, memoized derived data. Previously every component re-filtered the
// full transaction arrays by month on each render (table, charts, insights,
// dashboard) and the store re-filtered again for totals. These hooks compute
// each derivation once per (data, month) and share the result.
"use client";

import { useMemo } from "react";
import { useTransactions } from "@/lib/queries";
import { useUiStore } from "@/hooks/use-ui-store";
import { computeAnalytics } from "@/lib/insights";
import type { TxKind } from "@/lib/transaction-ui";

export function useCurrentMonth() {
  return useUiStore((s) => s.currentMonth);
}

/** Transactions of one kind, filtered to the selected month. */
export function useMonthTransactions(kind: TxKind) {
  const month = useUiStore((s) => s.currentMonth);
  const { data } = useTransactions(kind);
  return useMemo(
    () => (data ?? []).filter((t) => t.date?.startsWith(month)),
    [data, month]
  );
}

/** Month totals + solvency, derived once. */
export function useMonthTotals() {
  const month = useUiStore((s) => s.currentMonth);
  const { data: expenses } = useTransactions("expense");
  const { data: income } = useTransactions("income");

  return useMemo(() => {
    let expenseTotal = 0;
    let incomeTotal = 0;
    for (const e of expenses ?? []) if (e.date?.startsWith(month)) expenseTotal += Number(e.amount);
    for (const i of income ?? []) if (i.date?.startsWith(month)) incomeTotal += Number(i.amount);
    return {
      expenseTotal,
      incomeTotal,
      balance: incomeTotal - expenseTotal,
      isBroke: incomeTotal < expenseTotal,
    };
  }, [expenses, income, month]);
}

/** Full AI analytics for the selected month, derived once. */
export function useAnalytics() {
  const month = useUiStore((s) => s.currentMonth);
  const { data: expenses } = useTransactions("expense");
  const { data: income } = useTransactions("income");

  return useMemo(
    () => computeAnalytics(expenses ?? [], income ?? [], month),
    [expenses, income, month]
  );
}
