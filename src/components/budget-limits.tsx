"use client";

// Per-category monthly budget limits with live progress against the viewed
// month's spending. Scope-aware: personal or family, following the workspace.

import { useMemo, useState } from "react";
import { Gauge, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import {
  useCategoryBudgets,
  useCurrency,
  useDeleteCategoryBudget,
  useScopedTransactions,
  useSetCategoryBudget,
} from "@/lib/queries";
import { useCurrentMonth } from "@/hooks/use-derived";
import { TX_CONFIG, formatCategory } from "@/lib/transaction-ui";

const AMOUNT_RE = /^\d+(\.\d{1,2})?$/;

export function BudgetLimits({ groupId = null }: { groupId?: string | null }) {
  const cfg = TX_CONFIG.expense;
  const month = useCurrentMonth();
  const currency = useCurrency();

  const { data: budgets = [], isLoading } = useCategoryBudgets(groupId);
  const { data: expenses = [] } = useScopedTransactions("expense", groupId);
  const setBudget = useSetCategoryBudget(groupId);
  const removeBudget = useDeleteCategoryBudget(groupId);

  const [category, setCategory] = useState("");
  const [limit, setLimit] = useState("");

  // This month's spend per category (normalized the same way expenses are stored).
  const spentByCategory = useMemo(() => {
    const map = new Map<string, number>();
    for (const t of expenses) {
      if (!t.date?.startsWith(month)) continue;
      map.set(t.category, (map.get(t.category) ?? 0) + Number(t.amount));
    }
    return map;
  }, [expenses, month]);

  // Categories the user can pick: defaults + seen in data, minus already-budgeted.
  const budgeted = new Set(budgets.map((b) => b.category));
  const options = [
    ...new Set([...cfg.defaultCategories, ...expenses.map((t) => t.category)]),
  ].filter((c) => !budgeted.has(c));

  const canSave = category && AMOUNT_RE.test(limit) && Number(limit) > 0;

  const save = () => {
    if (!canSave) return;
    setBudget.mutate(
      { category: cfg.normalizeCategory(category), monthlyLimit: Number(limit) },
      { onSuccess: () => { setCategory(""); setLimit(""); } }
    );
  };

  if (isLoading) return null;

  return (
    <Card className="space-y-4 p-4 shadow-soft sm:p-6">
      <div className="flex items-center gap-2.5">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/15 text-primary ring-1 ring-primary/20">
          <Gauge className="h-[1.05rem] w-[1.05rem]" />
        </span>
        <div>
          <h2 className="font-display text-base font-bold leading-none tracking-tight">
            Category budgets
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Monthly limits · progress for {month}
          </p>
        </div>
      </div>

      {budgets.length > 0 && (
        <ul className="space-y-3">
          {budgets.map((b) => {
            const spent = spentByCategory.get(b.category) ?? 0;
            const ratio = spent / Number(b.monthly_limit);
            const over = ratio > 1;
            const warn = !over && ratio >= 0.8;
            return (
              <li key={b.id}>
                <div className="mb-1 flex items-center justify-between gap-2 text-sm">
                  <span className="flex items-center gap-2 font-medium">
                    {formatCategory(b.category)}
                    {over && (
                      <span className="rounded-full bg-rose-500/15 px-2 py-0.5 text-[11px] font-semibold text-rose-500 dark:text-rose-400">
                        {(spent - Number(b.monthly_limit)).toLocaleString()} {currency} over
                      </span>
                    )}
                    {warn && (
                      <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-[11px] font-semibold text-amber-600 dark:text-amber-400">
                        {Math.round(ratio * 100)}%
                      </span>
                    )}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="font-mono text-xs tabular text-muted-foreground">
                      {spent.toLocaleString()} / {Number(b.monthly_limit).toLocaleString()} {currency}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-muted-foreground hover:text-rose-500"
                      onClick={() => removeBudget.mutate(b.id)}
                      aria-label={`Remove budget for ${formatCategory(b.category)}`}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </span>
                </div>
                <div
                  className="h-2 overflow-hidden rounded-full bg-muted"
                  role="progressbar"
                  aria-valuenow={Math.round(ratio * 100)}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label={`${formatCategory(b.category)} budget used`}
                >
                  <div
                    className={cn(
                      "h-full rounded-full transition-all",
                      over ? "bg-rose-500" : warn ? "bg-amber-400" : "bg-primary"
                    )}
                    style={{ width: `${Math.min(ratio, 1) * 100}%` }}
                  />
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <div className="flex flex-wrap items-end gap-2">
        <div className="min-w-[10rem] flex-1">
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="h-9 text-sm">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              {options.map((c) => (
                <SelectItem key={c} value={c}>
                  {formatCategory(c)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Input
          type="number"
          step="0.01"
          inputMode="decimal"
          value={limit}
          onChange={(e) => setLimit(e.target.value)}
          placeholder={`Limit (${currency})`}
          className="h-9 w-36 text-sm"
          aria-label="Monthly limit"
        />
        <Button
          size="sm"
          className="h-9 font-semibold"
          disabled={!canSave || setBudget.isPending}
          onClick={save}
        >
          <Plus className="mr-1 h-4 w-4" />
          Set limit
        </Button>
      </div>
      {budgets.length === 0 && (
        <p className="text-xs text-muted-foreground">
          Set a monthly limit per category and watch spending against it here.
        </p>
      )}
    </Card>
  );
}
