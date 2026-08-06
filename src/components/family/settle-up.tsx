"use client";

// Splitwise-style settle-up: who paid what vs an equal fair share of this
// month's shared expenses, plus the minimal set of transfers to even out.

import { useMemo } from "react";
import { ArrowRight, Scale } from "lucide-react";
import { Card } from "@/components/ui/card";
import { MemberAvatar } from "@/components/member-avatar";
import { memberLabel } from "@/lib/member-ui";
import { cn } from "@/lib/utils";
import type { GroupMember, Transaction } from "@/types";

interface Transfer {
  from: string;
  to: string;
  amount: number;
}

/** Ignore sub-cent noise when deciding whether someone owes anything. */
const EPSILON = 0.005;

export function SettleUp({
  monthExpenses,
  memberMap,
  currency,
  onDisable,
}: {
  monthExpenses: Transaction[];
  memberMap: Map<string, GroupMember>;
  currency: string;
  /** Renders a "turn off" affordance when provided. */
  onDisable?: () => void;
}) {
  const { balances, transfers } = useMemo(() => {
    const memberIds = [...memberMap.keys()];
    if (memberIds.length < 2) return { balances: [], transfers: [] as Transfer[] };

    const paid = new Map<string, number>(memberIds.map((id) => [id, 0]));
    let total = 0;
    for (const e of monthExpenses) {
      const amt = Number(e.amount);
      total += amt;
      // Payments by since-departed members still count toward the total but
      // can't be settled against a roster entry.
      if (paid.has(e.user_id)) paid.set(e.user_id, (paid.get(e.user_id) ?? 0) + amt);
    }
    const share = total / memberIds.length;

    const balanceRows = memberIds
      .map((userId) => ({ userId, balance: (paid.get(userId) ?? 0) - share }))
      .sort((a, b) => b.balance - a.balance);

    // Greedy matching: biggest debtor pays biggest creditor until settled.
    const creditors = balanceRows
      .filter((b) => b.balance > EPSILON)
      .map((b) => ({ ...b }));
    const debtors = balanceRows
      .filter((b) => b.balance < -EPSILON)
      .map((b) => ({ ...b }));
    const out: Transfer[] = [];
    let i = 0;
    let j = 0;
    while (i < debtors.length && j < creditors.length) {
      const amount = Math.min(-debtors[i].balance, creditors[j].balance);
      out.push({ from: debtors[i].userId, to: creditors[j].userId, amount });
      debtors[i].balance += amount;
      creditors[j].balance -= amount;
      if (debtors[i].balance >= -EPSILON) i++;
      if (creditors[j].balance <= EPSILON) j++;
    }

    return { balances: balanceRows, transfers: out };
  }, [monthExpenses, memberMap]);

  const labelFor = (userId: string) =>
    memberLabel(memberMap.get(userId)?.profile ?? null, "Member");

  if (balances.length === 0) return null; // solo group — nothing to settle

  return (
    <Card className="p-5 shadow-soft">
      <div className="mb-4 flex items-center gap-2.5">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/15 text-primary ring-1 ring-primary/20">
          <Scale className="h-[1.05rem] w-[1.05rem]" />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="font-display text-base font-bold leading-none tracking-tight">
            Settle up
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Equal split of this month&apos;s shared expenses
          </p>
        </div>
        {onDisable && (
          <button
            type="button"
            onClick={onDisable}
            className="shrink-0 text-xs text-muted-foreground underline-offset-2 transition-colors hover:text-foreground hover:underline"
          >
            Turn off
          </button>
        )}
      </div>

      <div className="space-y-2">
        {balances.map(({ userId, balance }) => {
          const label = labelFor(userId);
          const settled = Math.abs(balance) <= EPSILON;
          return (
            <div key={userId} className="flex items-center gap-2.5">
              <MemberAvatar
                id={userId}
                label={label}
                avatarUrl={memberMap.get(userId)?.profile?.avatar_url}
                size={24}
              />
              <span className="min-w-0 flex-1 truncate text-sm">{label}</span>
              <span
                className={cn(
                  "font-mono text-xs font-semibold tabular",
                  settled
                    ? "text-muted-foreground"
                    : balance > 0
                      ? "text-emerald-600 dark:text-emerald-400"
                      : "text-rose-600 dark:text-rose-400"
                )}
              >
                {settled
                  ? "settled"
                  : `${balance > 0 ? "+" : "−"}${Math.abs(balance).toLocaleString(undefined, { maximumFractionDigits: 2 })} ${currency}`}
              </span>
            </div>
          );
        })}
      </div>

      {transfers.length > 0 && (
        <div className="mt-4 space-y-2 border-t border-border pt-3">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            To settle
          </p>
          {transfers.map((t, idx) => (
            <div
              key={idx}
              className="flex items-center gap-2 rounded-lg bg-muted/40 px-3 py-2 text-sm"
            >
              <span className="min-w-0 truncate font-medium">{labelFor(t.from)}</span>
              <ArrowRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
              <span className="min-w-0 flex-1 truncate font-medium">{labelFor(t.to)}</span>
              <span className="shrink-0 font-mono text-xs font-semibold tabular">
                {t.amount.toLocaleString(undefined, { maximumFractionDigits: 2 })} {currency}
              </span>
            </div>
          ))}
        </div>
      )}
      {transfers.length === 0 && (
        <p className="mt-4 border-t border-border pt-3 text-xs text-muted-foreground">
          Everyone is even — nothing to settle this month.
        </p>
      )}
    </Card>
  );
}
