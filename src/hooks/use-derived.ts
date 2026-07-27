// src/hooks/use-derived.ts
// Centralized, memoized derived data. Previously every component re-filtered the
// full transaction arrays by month on each render (table, charts, insights,
// dashboard) and the store re-filtered again for totals. These hooks compute
// each derivation once per (data, month) and share the result.
"use client";

import { useMemo } from "react";
import {
  useSavingsContributions,
  useSavingsGoals,
  useTransactions,
} from "@/lib/queries";
import { useUiStore } from "@/hooks/use-ui-store";
import { computeAnalytics } from "@/lib/insights";
import { computeSavingsSummary } from "@/lib/savings";

export function useCurrentMonth() {
  return useUiStore((s) => s.currentMonth);
}

/** Full AI analytics for the selected month, derived once. */
export function useAnalytics() {
  const month = useUiStore((s) => s.currentMonth);
  const { data: expenses } = useTransactions("expense");
  const { data: income } = useTransactions("income");
  const { data: contributions } = useSavingsContributions(null);

  return useMemo(
    () => computeAnalytics(expenses ?? [], income ?? [], month, contributions ?? []),
    [expenses, income, month, contributions]
  );
}

/**
 * Per-goal + overall savings totals for the selected month, derived once.
 * Personal when groupId is null, otherwise the family group's shared goals.
 */
export function useSavingsSummary(groupId: string | null = null) {
  const month = useUiStore((s) => s.currentMonth);
  const { data: goals } = useSavingsGoals(groupId);
  const { data: contributions } = useSavingsContributions(groupId);

  return useMemo(
    () => computeSavingsSummary(goals ?? [], contributions ?? [], month),
    [goals, contributions, month]
  );
}
