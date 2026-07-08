"use client";

import { useMemo } from "react";
import Link from "next/link";
import { Loader2, TrendingDown, TrendingUp, Users, Wallet } from "lucide-react";
import { StatCard } from "@/components/stat-card";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MemberRoster } from "@/components/family/member-roster";
import { InvitePeople } from "@/components/family/invite-people";
import { SharedLedger } from "@/components/family/shared-ledger";
import { MemberBreakdown } from "@/components/family/member-breakdown";
import { useAuthUser } from "@/lib/auth-context";
import { useCurrency, useGroupTransactions } from "@/lib/queries";
import { useUiStore } from "@/hooks/use-ui-store";
import { useRealtimeLedger } from "@/hooks/use-realtime-ledger";
import { computeAnalytics } from "@/lib/insights";
import { useGroups, useGroupMembers } from "@/lib/group-queries";

/**
 * Shared household overview for a single family group: combined stats, the
 * shared ledger, per-member breakdown and roster. `onLeft` fires when the
 * current user leaves the active group so the caller can reset the scope.
 */
export function FamilyOverview({
  groupId,
  onLeft,
}: {
  groupId: string;
  onLeft: () => void;
}) {
  const currentUserId = useAuthUser()?.id ?? null;
  const currency = useCurrency();
  const month = useUiStore((s) => s.currentMonth);

  const { data: groups } = useGroups();
  const activeGroup = groups?.find((g) => g.id === groupId) ?? null;

  const { data: members } = useGroupMembers(groupId);
  const memberIds = useMemo(() => (members ?? []).map((m) => m.user_id), [members]);

  // Shared budget = transactions tagged to this group (group_id), across members.
  const { data: groupExpenses = [], isLoading: expLoading } = useGroupTransactions("expense", groupId);
  const { data: groupIncome = [], isLoading: incLoading } = useGroupTransactions("income", groupId);
  const ledgerLoading = expLoading || incLoading;

  // Live household updates: refresh when any member changes a shared row.
  useRealtimeLedger(true);

  const memberMap = useMemo(
    () => new Map((members ?? []).map((m) => [m.user_id, m])),
    [members]
  );

  const monthExpenses = useMemo(
    () => groupExpenses.filter((t) => t.date?.startsWith(month)),
    [groupExpenses, month]
  );
  const monthIncome = useMemo(
    () => groupIncome.filter((t) => t.date?.startsWith(month)),
    [groupIncome, month]
  );

  const analytics = useMemo(
    () => computeAnalytics(groupExpenses, groupIncome, month),
    [groupExpenses, groupIncome, month]
  );

  const fmt = (n: number) => Math.round(n).toLocaleString();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-end gap-2">
        <Button asChild variant="ghost" size="sm" className="rounded-full text-muted-foreground hover:text-foreground">
          <Link href="/expenses">
            <TrendingDown className="h-4 w-4" />
            Add shared expense
          </Link>
        </Button>
        <Button asChild variant="ghost" size="sm" className="rounded-full text-muted-foreground hover:text-foreground">
          <Link href="/income">
            <TrendingUp className="h-4 w-4" />
            Add shared income
          </Link>
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatCard
          label="Net balance"
          value={fmt(analytics.balance)}
          unit={currency}
          icon={Wallet}
          tone={analytics.balance < 0 ? "negative" : "positive"}
          featured
          beam
        />
        <StatCard label="Income" value={fmt(analytics.incomeTotal)} unit={currency} icon={TrendingUp} tone="positive" />
        <StatCard label="Expenses" value={fmt(analytics.expenseTotal)} unit={currency} icon={TrendingDown} tone="negative" />
        <StatCard
          label="Members"
          value={String(members?.length ?? 0)}
          icon={Users}
          tone="accent"
          featured
          hint={<span className="text-xs text-muted-foreground">{activeGroup?.name}</span>}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          {ledgerLoading ? (
            <Card className="flex h-64 items-center justify-center gap-2 text-sm text-muted-foreground shadow-soft">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading the shared ledger…
            </Card>
          ) : (
            <SharedLedger
              monthExpenses={monthExpenses}
              monthIncome={monthIncome}
              memberMap={memberMap}
              currency={currency}
            />
          )}
        </div>

        <div className="space-y-4">
          <MemberBreakdown monthExpenses={monthExpenses} memberMap={memberMap} currency={currency} />

          <Card className="p-5 shadow-soft">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-display text-base font-bold tracking-tight">
                Members
                <span className="ml-1.5 text-sm font-normal text-muted-foreground">
                  {members?.length ?? 0}
                </span>
              </h2>
            </div>

            {activeGroup && members ? (
              <>
                <MemberRoster
                  group={activeGroup}
                  members={members}
                  currentUserId={currentUserId}
                  onLeft={onLeft}
                />
                <div className="mt-4 border-t border-border/60 pt-4">
                  <InvitePeople groupId={activeGroup.id} memberIds={new Set(memberIds)} />
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2 py-4 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading members…
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
