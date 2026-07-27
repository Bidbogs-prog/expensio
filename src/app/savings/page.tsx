"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AlertTriangle, CalendarCheck, Coins, PiggyBank, Users } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { CurrencySelect } from "@/components/currency-select";
import { MonthNavigator } from "@/components/monthNavigator";
import { ScopeSwitcher } from "@/components/scope-switcher";
import { StatCard } from "@/components/stat-card";
import { SavingsGoalCard } from "@/components/savings-goal-card";
import { SavingsGoalForm } from "@/components/savings-goal-form";
import { SavingsGrowth } from "@/components/savings-growth";
import { SavingsHistory } from "@/components/savings-history";
import { Card } from "@/components/ui/card";
import { useCurrency } from "@/lib/queries";
import { useGroups, useGroupMembers } from "@/lib/group-queries";
import { useAuthUser } from "@/lib/auth-context";
import { useRealtimeLedger } from "@/hooks/use-realtime-ledger";
import { useCurrentMonth, useSavingsSummary } from "@/hooks/use-derived";
import { useUiStore } from "@/hooks/use-ui-store";

export default function SavingsPage() {
  const error = useUiStore((s) => s.error);
  const currency = useCurrency();
  const month = useCurrentMonth();
  const currentUserId = useAuthUser()?.id ?? null;

  const { data: groups = [] } = useGroups();
  const [scope, setScope] = useState<string | null>(null); // null = personal

  // Keep the scope valid if the user's groups change (e.g. leaves a group).
  useEffect(() => {
    if (scope && !groups.some((g) => g.id === scope)) setScope(null);
  }, [groups, scope]);

  const { data: members } = useGroupMembers(scope);
  const memberMap = useMemo(
    () => new Map((members ?? []).map((m) => [m.user_id, m])),
    [members]
  );

  // Live updates from co-members while viewing shared goals.
  useRealtimeLedger(!!scope);

  const s = useSavingsSummary(scope);

  return (
    <div className="min-h-screen">
      <PageHeader
        eyebrow="Pay yourself first"
        title="Savings"
        subtitle="Set money aside for goals — it never counts as spending"
      >
        <div className="hidden sm:block">
          <MonthNavigator />
        </div>
        <CurrencySelect />
      </PageHeader>

      <div className="mx-auto w-full max-w-6xl space-y-6 px-4 py-6 sm:px-6">
        <div className="flex justify-center sm:hidden">
          <MonthNavigator />
        </div>

        {error && (
          <Card className="flex items-center gap-3 border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
            <AlertTriangle className="h-5 w-5 shrink-0" />
            {error}
          </Card>
        )}

        {groups.length > 0 ? (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <ScopeSwitcher groups={groups} value={scope} onChange={setScope} />
            <p className="text-xs text-muted-foreground">
              {scope
                ? "Shared goals — every member can see and contribute."
                : "Private goals in your personal budget."}
            </p>
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">
            Want savings goals the whole household funds together?{" "}
            <Link href="/" className="inline-flex items-center gap-1 text-primary hover:underline">
              <Users className="h-3.5 w-3.5" />
              Create a family group
            </Link>
            .
          </p>
        )}

        {/* Stat row */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
          <StatCard
            label="Saved this month"
            value={Math.round(s.monthTotal)}
            unit={currency}
            icon={PiggyBank}
            tone="sky"
            featured
            beam
            hint={
              <span className="text-xs text-muted-foreground">
                {s.plannedCount > 0
                  ? `${s.fundedCount} of ${s.plannedCount} plans funded`
                  : "No monthly plan yet"}
              </span>
            }
          />
          <StatCard
            label="Total saved"
            value={Math.round(s.lifetimeTotal)}
            unit={currency}
            icon={Coins}
            tone="sky"
            hint={
              <span className="text-xs text-muted-foreground">
                across {s.goals.length} goal{s.goals.length === 1 ? "" : "s"} · through{" "}
                {month.replace("-", " · ")}
              </span>
            }
          />
          <StatCard
            label="Monthly plan"
            value={Math.round(s.plannedMonthly)}
            unit={currency}
            icon={CalendarCheck}
            tone="neutral"
            hint={
              <span className="text-xs text-muted-foreground">
                allocated to goals each month
              </span>
            }
          />
        </div>

        {/* Goals */}
        <div>
          <h2 className="mb-3 font-display text-lg font-bold tracking-tight">
            {scope ? "Household goals" : "Goals"}
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {s.goals.map((g) => (
              <SavingsGoalCard
                key={g.goal.id}
                summary={g}
                currency={currency}
                month={month}
                groupId={scope}
              />
            ))}
            <SavingsGoalForm currency={currency} groupId={scope} />
          </div>
        </div>

        {/* Growth + history */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <SavingsGrowth groupId={scope} />
          <SavingsHistory groupId={scope} members={memberMap} currentUserId={currentUserId} />
        </div>
      </div>
    </div>
  );
}
