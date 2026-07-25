"use client";

import { useMemo } from "react";
import { History, Trash2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  useCurrency,
  useDeleteSavingsContribution,
  useSavingsContributions,
  useSavingsGoals,
} from "@/lib/queries";
import { useCurrentMonth } from "@/hooks/use-derived";

/** The viewed month's contributions, newest first, each removable. */
export function SavingsHistory() {
  const { data: goals = [] } = useSavingsGoals();
  const { data: contributions = [] } = useSavingsContributions();
  const currency = useCurrency();
  const month = useCurrentMonth();
  const remove = useDeleteSavingsContribution();

  const goalById = useMemo(() => new Map(goals.map((g) => [g.id, g])), [goals]);
  const rows = useMemo(
    () =>
      contributions
        .filter((c) => c.date.startsWith(month))
        .toSorted((a, b) => (a.date < b.date ? 1 : -1)),
    [contributions, month]
  );

  return (
    <Card className="p-5 shadow-soft">
      <div className="mb-4 flex items-center gap-2.5">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-sky-500/12 text-sky-400 ring-1 ring-sky-500/20">
          <History className="h-[1.05rem] w-[1.05rem]" />
        </span>
        <div>
          <h2 className="font-display text-base font-bold leading-none tracking-tight">
            This month&apos;s contributions
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Money moved into goals — not counted as spending
          </p>
        </div>
      </div>

      {rows.length === 0 ? (
        <p className="py-6 text-center text-sm text-muted-foreground">
          Nothing set aside yet this month — add to a goal above to start.
        </p>
      ) : (
        <ul className="divide-y divide-border/60">
          {rows.map((c) => {
            const goal = goalById.get(c.goal_id);
            return (
              <li key={c.id} className="group flex items-center gap-3 py-2.5">
                <span
                  className="h-2 w-2 shrink-0 rounded-full"
                  style={{ background: goal?.color ?? "#38bdf8" }}
                />
                <span className="min-w-0 flex-1 truncate text-sm font-medium">
                  {goal?.name ?? "Deleted goal"}
                </span>
                <span className="text-xs text-muted-foreground">{c.date}</span>
                <span className="font-mono text-sm font-semibold tabular text-sky-400">
                  +{Math.round(Number(c.amount)).toLocaleString()} {currency}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => remove.mutate(c.id)}
                  disabled={remove.isPending}
                  title="Remove contribution"
                  className="h-7 w-7 text-muted-foreground opacity-0 transition-opacity hover:text-destructive focus-visible:opacity-100 group-hover:opacity-100"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}
