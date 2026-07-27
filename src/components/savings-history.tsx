"use client";

import { useMemo } from "react";
import { History, Trash2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MemberAvatar } from "@/components/member-avatar";
import {
  useCurrency,
  useDeleteSavingsContribution,
  useSavingsContributions,
  useSavingsGoals,
} from "@/lib/queries";
import { useCurrentMonth } from "@/hooks/use-derived";
import type { GroupMember } from "@/types";

/**
 * The viewed month's contributions, newest first. In family scope each row is
 * attributed to the member who made it; you can only remove your own.
 */
export function SavingsHistory({
  groupId = null,
  members,
  currentUserId = null,
}: {
  groupId?: string | null;
  members?: Map<string, GroupMember>;
  currentUserId?: string | null;
}) {
  const { data: goals = [] } = useSavingsGoals(groupId);
  const { data: contributions = [] } = useSavingsContributions(groupId);
  const currency = useCurrency();
  const month = useCurrentMonth();
  const remove = useDeleteSavingsContribution(groupId);

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
            {groupId
              ? "Everything the household set aside — not counted as spending"
              : "Money moved into goals — not counted as spending"}
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
            const member = groupId ? members?.get(c.user_id) : undefined;
            const memberLabel =
              member?.profile?.full_name ?? member?.profile?.email ?? "Member";
            // In family scope you can only delete what you contributed (RLS
            // enforces this server-side too).
            const canDelete = !groupId || c.user_id === currentUserId;
            return (
              <li key={c.id} className="group flex items-center gap-3 py-2.5">
                <span
                  className="h-2 w-2 shrink-0 rounded-full"
                  style={{ background: goal?.color ?? "#38bdf8" }}
                />
                <span className="min-w-0 flex-1 truncate text-sm font-medium">
                  {goal?.name ?? "Deleted goal"}
                </span>
                {groupId && (
                  <span title={memberLabel}>
                    <MemberAvatar
                      id={c.user_id}
                      label={memberLabel}
                      avatarUrl={member?.profile?.avatar_url}
                      size={20}
                    />
                  </span>
                )}
                <span className="text-xs text-muted-foreground">{c.date}</span>
                <span className="font-mono text-sm font-semibold tabular text-sky-400">
                  +{Math.round(Number(c.amount)).toLocaleString()} {currency}
                </span>
                {canDelete && (
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
                )}
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}
