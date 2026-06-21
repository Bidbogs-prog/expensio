"use client";

import { useMemo } from "react";
import { Users } from "lucide-react";
import { Card } from "@/components/ui/card";
import { MemberAvatar } from "@/components/member-avatar";
import { memberColor, memberLabel } from "@/lib/member-ui";
import type { GroupMember, Transaction } from "@/types";

export function MemberBreakdown({
  monthExpenses,
  memberMap,
  currency,
}: {
  monthExpenses: Transaction[];
  memberMap: Map<string, GroupMember>;
  currency: string;
}) {
  const { rows, total } = useMemo(() => {
    const byMember = new Map<string, number>();
    let sum = 0;
    for (const e of monthExpenses) {
      const amt = Number(e.amount);
      byMember.set(e.user_id, (byMember.get(e.user_id) ?? 0) + amt);
      sum += amt;
    }
    const list = [...byMember.entries()]
      .map(([userId, amount]) => ({ userId, amount }))
      .sort((a, b) => b.amount - a.amount);
    return { rows: list, total: sum };
  }, [monthExpenses]);

  return (
    <Card className="p-5 shadow-soft">
      <div className="mb-4 flex items-center gap-2.5">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/15 text-primary ring-1 ring-primary/20">
          <Users className="h-[1.05rem] w-[1.05rem]" />
        </span>
        <div>
          <h2 className="font-display text-base font-bold leading-none tracking-tight">
            Spending by member
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">This month</p>
        </div>
      </div>

      {rows.length === 0 ? (
        <p className="py-6 text-center text-sm text-muted-foreground">No spending yet this month.</p>
      ) : (
        <div className="space-y-3">
          {rows.map(({ userId, amount }) => {
            const member = memberMap.get(userId);
            const label = memberLabel(member?.profile ?? null, "Member");
            const pct = total > 0 ? (amount / total) * 100 : 0;
            const color = memberColor(userId);
            return (
              <div key={userId} className="flex items-center gap-3">
                <MemberAvatar id={userId} label={label} avatarUrl={member?.profile?.avatar_url} size={28} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate text-sm font-medium">{label}</span>
                    <span className="shrink-0 font-mono text-xs tabular text-muted-foreground">
                      {Math.round(amount).toLocaleString()} {currency}
                    </span>
                  </div>
                  <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-secondary">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ width: `${pct}%`, background: color }}
                    />
                  </div>
                </div>
                <span className="w-9 shrink-0 text-right font-mono text-xs tabular text-muted-foreground">
                  {Math.round(pct)}%
                </span>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}
