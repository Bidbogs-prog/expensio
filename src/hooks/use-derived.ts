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

export function useCurrentMonth() {
  return useUiStore((s) => s.currentMonth);
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
