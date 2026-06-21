"use client";

import { useEffect, useMemo, useState } from "react";
import { Loader2, Plus, TrendingDown, TrendingUp, Users, Wallet } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { CurrencySelect } from "@/components/currency-select";
import { MonthNavigator } from "@/components/monthNavigator";
import { StatCard } from "@/components/stat-card";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { IncomingInvites } from "@/components/family/incoming-invites";
import { CreateGroupDialog } from "@/components/family/create-group-dialog";
import { MemberRoster } from "@/components/family/member-roster";
import { InvitePeople } from "@/components/family/invite-people";
import { SharedLedger } from "@/components/family/shared-ledger";
import { MemberBreakdown } from "@/components/family/member-breakdown";
import { useAuthUser } from "@/lib/auth-context";
import { useCurrency } from "@/lib/queries";
import { useUiStore } from "@/hooks/use-ui-store";
import { useRealtimeLedger } from "@/hooks/use-realtime-ledger";
import { computeAnalytics } from "@/lib/insights";
import { useGroups, useGroupLedger, useGroupMembers } from "@/lib/group-queries";
import { cn } from "@/lib/utils";

export default function FamilyPage() {
  const currentUserId = useAuthUser()?.id ?? null;
  const currency = useCurrency();
  const month = useUiStore((s) => s.currentMonth);

  const { data: groups, isLoading: groupsLoading } = useGroups();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  // Keep the active group valid as the list changes (created / left).
  useEffect(() => {
    if (!groups) return;
    if (groups.length === 0) setActiveId(null);
    else if (!activeId || !groups.some((g) => g.id === activeId)) setActiveId(groups[0].id);
  }, [groups, activeId]);

  const activeGroup = groups?.find((g) => g.id === activeId) ?? null;
  const { data: members } = useGroupMembers(activeId);
  const memberIds = useMemo(() => (members ?? []).map((m) => m.user_id), [members]);
  const { data: ledger, isLoading: ledgerLoading } = useGroupLedger(memberIds);

  // Live household updates: refresh the ledger when any visible member changes a row.
  useRealtimeLedger(!!activeId);

  const memberMap = useMemo(
    () => new Map((members ?? []).map((m) => [m.user_id, m])),
    [members]
  );

  const monthExpenses = useMemo(
    () => (ledger?.expenses ?? []).filter((t) => t.date?.startsWith(month)),
    [ledger, month]
  );
  const monthIncome = useMemo(
    () => (ledger?.income ?? []).filter((t) => t.date?.startsWith(month)),
    [ledger, month]
  );

  const analytics = useMemo(
    () => computeAnalytics(ledger?.expenses ?? [], ledger?.income ?? [], month),
    [ledger, month]
  );

  const fmt = (n: number) => Math.round(n).toLocaleString();

  return (
    <div className="min-h-screen">
      <PageHeader eyebrow="Shared" title="Family" subtitle="Your household, combined">
        <div className="hidden sm:block">
          <MonthNavigator />
        </div>
        <CurrencySelect />
      </PageHeader>

      <div className="mx-auto w-full max-w-6xl space-y-6 px-4 py-6 sm:px-6">
        <div className="flex justify-center sm:hidden">
          <MonthNavigator />
        </div>

        <IncomingInvites />

        {groupsLoading ? (
          <div className="flex items-center justify-center gap-2 py-20 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading your groups…
          </div>
        ) : !groups || groups.length === 0 ? (
          <EmptyState onCreate={() => setShowCreate(true)} />
        ) : (
          <>
            {/* Group switcher */}
            <div className="flex flex-wrap items-center gap-2">
              {groups.map((g) => (
                <button
                  key={g.id}
                  onClick={() => setActiveId(g.id)}
                  className={cn(
                    "rounded-full border px-4 py-1.5 text-sm font-medium transition-smooth",
                    g.id === activeId
                      ? "border-primary/40 bg-primary/12 text-primary"
                      : "border-border bg-card/60 text-muted-foreground hover:text-foreground"
                  )}
                >
                  {g.name}
                </button>
              ))}
              <Button variant="outline" size="sm" onClick={() => setShowCreate(true)} className="rounded-full">
                <Plus className="h-4 w-4" />
                New group
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
                        onLeft={() => setActiveId(null)}
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
          </>
        )}
      </div>

      <CreateGroupDialog
        open={showCreate}
        onClose={() => setShowCreate(false)}
        onCreated={(id) => setActiveId(id)}
      />
    </div>
  );
}

function EmptyState({ onCreate }: { onCreate: () => void }) {
  return (
    <Card className="relative overflow-hidden p-10 text-center shadow-soft">
      <div className="pointer-events-none absolute -right-16 -top-20 h-48 w-48 rounded-full bg-primary/10 blur-3xl" />
      <div className="relative mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/15 text-primary ring-1 ring-primary/20">
        <Users className="h-7 w-7" />
      </div>
      <h2 className="relative font-display text-xl font-bold tracking-tight">Start a family group</h2>
      <p className="relative mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
        Create a household, invite people, and see everyone's expenses & income in one shared view.
      </p>
      <Button onClick={onCreate} className="relative mt-6 glow-primary">
        <Plus className="h-4 w-4" />
        Create a group
      </Button>
    </Card>
  );
}
