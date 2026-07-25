"use client";

import { useState } from "react";
import { Check, Plus, Trash2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NumberTicker } from "@/components/magicui/number-ticker";
import { useAddSavingsContribution, useDeleteSavingsGoal } from "@/lib/queries";
import { shortMonth } from "@/lib/insights";
import type { GoalSummary } from "@/lib/savings";
import { cn } from "@/lib/utils";

/**
 * One savings jar: lifetime progress toward the target (goal-colored bar),
 * this month's funding status against the plan, and an inline contribute field.
 */
export function SavingsGoalCard({
  summary,
  currency,
  month,
}: {
  summary: GoalSummary;
  currency: string;
  month: string;
}) {
  const { goal, lifetimeTotal, monthTotal, remainingThisMonth, funded, targetPct } = summary;
  const add = useAddSavingsContribution();
  const remove = useDeleteSavingsGoal();
  const [amount, setAmount] = useState("");

  const monthName = shortMonth(month);
  const reached = targetPct !== null && targetPct >= 1;

  const contribute = () => {
    const value = Number(amount);
    if (!/^\d+$/.test(amount) || value <= 0) return;
    // Land the contribution inside the viewed month so it shows up immediately.
    const today = new Date().toISOString().slice(0, 10);
    add.mutate({
      goal_id: goal.id,
      amount: value,
      date: today.startsWith(month) ? today : `${month}-01`,
    });
    setAmount("");
  };

  return (
    <Card className="hover-lift group relative overflow-hidden p-5 shadow-soft">
      {/* Header: identity + delete */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <span
            className="h-2.5 w-2.5 shrink-0 rounded-full"
            style={{ background: goal.color }}
          />
          <h3 className="truncate font-display text-sm font-bold tracking-tight">
            {goal.name}
          </h3>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => remove.mutate(goal.id)}
          disabled={remove.isPending}
          title="Delete goal and its history"
          className="h-7 w-7 text-muted-foreground opacity-0 transition-opacity hover:text-destructive focus-visible:opacity-100 group-hover:opacity-100"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>

      {/* Lifetime total (+ target) */}
      <p className="mt-3 font-display text-2xl font-extrabold tracking-tight tabular">
        <NumberTicker value={Math.round(lifetimeTotal)} />
        <span className="ml-1 text-sm font-semibold text-muted-foreground">{currency}</span>
        {goal.target_amount != null && (
          <span className="ml-1.5 text-sm font-medium text-muted-foreground">
            of {Math.round(goal.target_amount).toLocaleString()}
          </span>
        )}
      </p>

      {/* Target progress */}
      {targetPct !== null ? (
        <div className="mt-3">
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.round(targetPct * 100)}%`, background: goal.color }}
            />
          </div>
          <p className="mt-1.5 text-xs text-muted-foreground">
            {reached
              ? "Target reached"
              : targetPct >= 0.8
                ? `${Math.round(targetPct * 100)}% — almost there`
                : `${Math.round(targetPct * 100)}% there`}
          </p>
        </div>
      ) : (
        <p className="mt-3 text-xs text-muted-foreground">Open-ended — keep stacking</p>
      )}

      {/* Month plan status */}
      <div className="mt-4 flex items-center justify-between gap-2 border-t border-border/60 pt-3">
        <p className="text-xs text-muted-foreground">
          {goal.monthly_allocation != null ? (
            <>
              {monthName}: {Math.round(monthTotal).toLocaleString()} /{" "}
              {Math.round(goal.monthly_allocation).toLocaleString()} planned
            </>
          ) : (
            <>
              {monthName}: {Math.round(monthTotal).toLocaleString()} {currency} saved
            </>
          )}
        </p>
        {funded && (
          <span
            className="inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold"
            style={{ background: `${goal.color}20`, color: goal.color }}
          >
            <Check className="h-3 w-3" />
            Funded
          </span>
        )}
      </div>

      {/* Inline contribute */}
      <form
        className="mt-3 flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          contribute();
        }}
      >
        <Input
          value={amount}
          onChange={(e) => setAmount(e.target.value.replace(/[^\d]/g, ""))}
          inputMode="numeric"
          placeholder={
            remainingThisMonth > 0
              ? `${Math.round(remainingThisMonth).toLocaleString()} to fund ${monthName}`
              : "Amount"
          }
          aria-label={`Contribution amount for ${goal.name}`}
          className="h-9 text-sm"
        />
        <Button
          type="submit"
          size="sm"
          disabled={add.isPending || !amount}
          className={cn("h-9 shrink-0 font-semibold")}
        >
          <Plus className="h-4 w-4" />
          Add
        </Button>
      </form>
    </Card>
  );
}
