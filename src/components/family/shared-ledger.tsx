"use client";

import { useMemo } from "react";
import { Check, Inbox } from "lucide-react";
import { Card } from "@/components/ui/card";
import { useExpenseContributions, useToggleContribution } from "@/lib/group-queries";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { MemberAvatar } from "@/components/member-avatar";
import { formatCategory } from "@/lib/transaction-ui";
import { memberLabel } from "@/lib/member-ui";
import { cn } from "@/lib/utils";
import type { GroupMember, Transaction } from "@/types";

interface Row extends Transaction {
  kind: "expense" | "income";
}

const EMPTY_SET: ReadonlySet<string> = new Set();

/**
 * Housemate check-off for one shared expense: the payer is settled by
 * definition; everyone else ticks the box once they've sent their share.
 */
function ContributionCell({
  expenseId,
  payerId,
  confirmed,
  memberIds,
  currentUserId,
  onToggle,
}: {
  expenseId: number;
  payerId: string;
  confirmed: ReadonlySet<string>;
  memberIds: string[];
  currentUserId: string | null;
  onToggle: (confirmed: boolean) => void;
}) {
  const owing = memberIds.filter((id) => id !== payerId);
  const sentCount = owing.filter((id) => confirmed.has(id)).length;
  const allSent = owing.length > 0 && sentCount === owing.length;
  const isPayer = currentUserId === payerId;
  const mine = currentUserId ? confirmed.has(currentUserId) : false;

  if (owing.length === 0) {
    return <span className="text-xs text-muted-foreground/60">—</span>;
  }

  return (
    <div className="flex items-center justify-center gap-1.5">
      {isPayer ? (
        <span
          className={cn(
            "text-xs tabular-nums",
            allSent ? "text-emerald-400" : "text-muted-foreground"
          )}
          title="Housemates who sent you their share"
        >
          {sentCount}/{owing.length} sent
        </span>
      ) : (
        <>
          <button
            type="button"
            role="checkbox"
            aria-checked={mine}
            aria-label={`Mark my share for expense ${expenseId} as sent`}
            onClick={() => onToggle(!mine)}
            className={cn(
              "flex h-5 w-5 items-center justify-center rounded border transition-colors",
              mine
                ? "border-emerald-500 bg-emerald-500/20 text-emerald-400"
                : "border-border text-transparent hover:border-emerald-500/60"
            )}
            title={mine ? "Sent — click to undo" : "I sent my share"}
          >
            <Check className="h-3.5 w-3.5" />
          </button>
          <span className="text-xs tabular-nums text-muted-foreground">
            {sentCount}/{owing.length}
          </span>
        </>
      )}
    </div>
  );
}

export function SharedLedger({
  monthExpenses,
  monthIncome,
  memberMap,
  currency,
  groupId,
  housemates = false,
  currentUserId = null,
}: {
  monthExpenses: Transaction[];
  monthIncome: Transaction[];
  memberMap: Map<string, GroupMember>;
  currency: string;
  groupId?: string;
  /** Housemates split bills: show the "sent my share" check-off column. */
  housemates?: boolean;
  currentUserId?: string | null;
}) {
  // Who has checked off which expense (housemate groups only).
  const { data: contributions = [] } = useExpenseContributions(
    groupId ?? null,
    housemates
  );
  const toggle = useToggleContribution(groupId ?? "", currentUserId);
  const confirmedBy = useMemo(() => {
    const map = new Map<number, Set<string>>();
    for (const c of contributions) {
      const set = map.get(c.expense_id) ?? new Set<string>();
      set.add(c.user_id);
      map.set(c.expense_id, set);
    }
    return map;
  }, [contributions]);
  const rows = useMemo<Row[]>(() => {
    const combined: Row[] = [
      ...monthExpenses.map((t) => ({ ...t, kind: "expense" as const })),
      ...monthIncome.map((t) => ({ ...t, kind: "income" as const })),
    ];
    // Most recent first; created_at as a tiebreaker within a day.
    return combined.sort((a, b) => {
      const d = (b.date ?? "").localeCompare(a.date ?? "");
      return d !== 0 ? d : (b.created_at ?? "").localeCompare(a.created_at ?? "");
    });
  }, [monthExpenses, monthIncome]);

  const formatDate = (date: string) =>
    date
      ? new Date(date).toLocaleDateString(undefined, { month: "short", day: "numeric" })
      : "—";

  return (
    <Card className="overflow-hidden shadow-soft">
      <div className="border-b border-border/60 px-5 py-4">
        <h2 className="font-display text-base font-bold tracking-tight">Household ledger</h2>
        <p className="text-xs text-muted-foreground">Shared expenses &amp; income added to this group</p>
      </div>

      {housemates && rows.length > 0 && (
        <p className="border-b border-border/60 bg-muted/20 px-5 py-2 text-xs text-muted-foreground">
          Splitting a bill? Everyone but the payer ticks “Sent?” once they’ve
          sent their share to whoever paid.
        </p>
      )}

      {rows.length === 0 ? (
        <div className="px-6 py-12 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <Inbox className="h-6 w-6" />
          </div>
          <h3 className="font-semibold">Nothing shared this month</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Add a shared expense or income from the Expenses / Income tabs — pick this
            household as the scope — and it shows up here for everyone.
          </p>
        </div>
      ) : (
        <div className="max-h-[520px] overflow-auto">
          <Table>
            <TableHeader className="sticky top-0 z-10 bg-card">
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-[26%]">Member</TableHead>
                <TableHead className="w-[26%]">Item</TableHead>
                <TableHead className="w-[20%]">Category</TableHead>
                <TableHead className="w-[12%]">Date</TableHead>
                <TableHead className="w-[16%] text-right">Amount</TableHead>
                {housemates && (
                  <TableHead className="w-[14%] text-center">Sent?</TableHead>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r) => {
                const member = memberMap.get(r.user_id);
                const label = memberLabel(member?.profile ?? null, "Member");
                const isExpense = r.kind === "expense";
                return (
                  <TableRow key={`${r.kind}-${r.id}`} className="transition-colors">
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <MemberAvatar
                          id={r.user_id}
                          label={label}
                          avatarUrl={member?.profile?.avatar_url}
                          size={26}
                        />
                        <span className="truncate text-sm font-medium">{label}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">{formatCategory(r.name)}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatCategory(r.category)}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDate(r.date)}
                    </TableCell>
                    <TableCell
                      className={cn(
                        "text-right font-mono font-semibold tabular",
                        isExpense ? "text-rose-400" : "text-emerald-400"
                      )}
                    >
                      {isExpense ? "−" : "+"}
                      {Number(r.amount).toLocaleString()} {currency}
                    </TableCell>
                    {housemates && (
                      <TableCell className="text-center">
                        {isExpense ? (
                          <ContributionCell
                            expenseId={r.id}
                            payerId={r.user_id}
                            confirmed={confirmedBy.get(r.id) ?? EMPTY_SET}
                            memberIds={[...memberMap.keys()]}
                            currentUserId={currentUserId}
                            onToggle={(confirmed) =>
                              toggle.mutate({ expenseId: r.id, confirmed })
                            }
                          />
                        ) : (
                          <span className="text-xs text-muted-foreground/60">—</span>
                        )}
                      </TableCell>
                    )}
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </Card>
  );
}
