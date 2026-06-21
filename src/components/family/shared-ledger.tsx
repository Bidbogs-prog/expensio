"use client";

import { useMemo } from "react";
import { Inbox } from "lucide-react";
import { Card } from "@/components/ui/card";
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

export function SharedLedger({
  monthExpenses,
  monthIncome,
  memberMap,
  currency,
}: {
  monthExpenses: Transaction[];
  monthIncome: Transaction[];
  memberMap: Map<string, GroupMember>;
  currency: string;
}) {
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
        <p className="text-xs text-muted-foreground">Everyone's expenses & income, combined</p>
      </div>

      {rows.length === 0 ? (
        <div className="px-6 py-12 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <Inbox className="h-6 w-6" />
          </div>
          <h3 className="font-semibold">Nothing logged this month</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Transactions from any member will show up here.
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
