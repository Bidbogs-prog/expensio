"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Check, Loader2, Pencil, TrendingDown, TrendingUp, Users, Wallet, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { StatCard } from "@/components/stat-card";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MemberRoster } from "@/components/family/member-roster";
import { InvitePeople } from "@/components/family/invite-people";
import { SharedLedger } from "@/components/family/shared-ledger";
import { MemberBreakdown } from "@/components/family/member-breakdown";
import { SettleUp } from "@/components/family/settle-up";
import { useAuthUser } from "@/lib/auth-context";
import { useCurrency, useGroupTransactions, useSavingsContributions } from "@/lib/queries";
import { useUiStore } from "@/hooks/use-ui-store";
import { useRealtimeLedger } from "@/hooks/use-realtime-ledger";
import { computeAnalytics } from "@/lib/insights";
import { cn } from "@/lib/utils";
import {
  useGroups,
  useGroupMembers,
  useRenameGroup,
  useSetGroupSettleUp,
} from "@/lib/group-queries";

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
  const setSettleUp = useSetGroupSettleUp();
  const rename = useRenameGroup();

  // Housemates share expenses only; income never enters the group.
  const isHousemates = activeGroup?.type === "housemates";
  const isOwner = activeGroup?.owner_id === currentUserId;
  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState("");

  const saveName = () => {
    const trimmed = nameDraft.trim();
    if (trimmed && trimmed !== activeGroup?.name) {
      rename.mutate({ groupId, name: trimmed });
    }
    setEditingName(false);
  };

  const { data: members } = useGroupMembers(groupId);
  const memberIds = useMemo(() => (members ?? []).map((m) => m.user_id), [members]);

  // Shared budget = transactions tagged to this group (group_id), across members.
  const { data: groupExpenses = [], isLoading: expLoading } = useGroupTransactions("expense", groupId);
  const { data: groupIncome = [], isLoading: incLoading } = useGroupTransactions("income", groupId);
  const { data: groupContributions = [] } = useSavingsContributions(groupId);
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
    () => computeAnalytics(groupExpenses, groupIncome, month, groupContributions),
    [groupExpenses, groupIncome, month, groupContributions]
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
        {!isHousemates && (
          <Button asChild variant="ghost" size="sm" className="rounded-full text-muted-foreground hover:text-foreground">
            <Link href="/income">
              <TrendingUp className="h-4 w-4" />
              Add shared income
            </Link>
          </Button>
        )}
      </div>

      {/* Stats — housemates track shared spending only, no income or balance. */}
      <div className={cn("grid grid-cols-2 gap-3 sm:gap-4", !isHousemates && "lg:grid-cols-4")}>
        {!isHousemates && (
          <>
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
          </>
        )}
        <StatCard
          label={isHousemates ? "Shared expenses" : "Expenses"}
          value={fmt(analytics.expenseTotal)}
          unit={currency}
          icon={TrendingDown}
          tone="negative"
          featured={isHousemates}
          beam={isHousemates}
        />
        <StatCard
          label="Members"
          value={String(members?.length ?? 0)}
          icon={Users}
          tone="accent"
          featured
          hint={
            <span className="text-xs text-muted-foreground">
              {activeGroup?.name}
              {isHousemates && " · housemates"}
            </span>
          }
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
              groupId={groupId}
              housemates={isHousemates}
              currentUserId={currentUserId}
            />
          )}
        </div>

        <div className="space-y-4">
          <MemberBreakdown monthExpenses={monthExpenses} memberMap={memberMap} currency={currency} />

          {activeGroup?.settle_up ? (
            <SettleUp
              monthExpenses={monthExpenses}
              memberMap={memberMap}
              currency={currency}
              onDisable={() => setSettleUp.mutate({ groupId, enabled: false })}
            />
          ) : (
            <div className="flex items-center justify-between gap-3 rounded-xl border border-dashed border-border/60 px-4 py-3">
              <p className="text-xs text-muted-foreground">
                Splitting costs? Turn on settle-up to see who owes whom. Households
                that pool money can leave it off.
              </p>
              <Button
                variant="outline"
                size="sm"
                className="h-8 shrink-0 text-xs"
                onClick={() => setSettleUp.mutate({ groupId, enabled: true })}
                disabled={setSettleUp.isPending}
              >
                Enable settle-up
              </Button>
            </div>
          )}

          <Card className="p-5 shadow-soft">
            <div className="mb-3 flex items-center justify-between gap-2">
              {editingName ? (
                <div className="flex flex-1 items-center gap-1.5">
                  <Input
                    value={nameDraft}
                    onChange={(e) => setNameDraft(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") saveName();
                      if (e.key === "Escape") setEditingName(false);
                    }}
                    maxLength={40}
                    className="h-8 text-sm"
                    autoFocus
                  />
                  <Button size="icon" onClick={saveName} disabled={rename.isPending} className="h-8 w-8 shrink-0">
                    <Check className="h-3.5 w-3.5" />
                  </Button>
                  <Button size="icon" variant="outline" onClick={() => setEditingName(false)} className="h-8 w-8 shrink-0">
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ) : (
                <h2 className="flex min-w-0 items-center gap-1.5 font-display text-base font-bold tracking-tight">
                  <span className="truncate">{activeGroup?.name ?? "Members"}</span>
                  <span className="shrink-0 text-sm font-normal text-muted-foreground">
                    · {members?.length ?? 0} member{(members?.length ?? 0) === 1 ? "" : "s"}
                  </span>
                  {isOwner && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setNameDraft(activeGroup?.name ?? "");
                        setEditingName(true);
                      }}
                      className="h-6 w-6 shrink-0 text-muted-foreground hover:text-foreground"
                      title="Rename group"
                    >
                      <Pencil className="h-3 w-3" />
                    </Button>
                  )}
                </h2>
              )}
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
