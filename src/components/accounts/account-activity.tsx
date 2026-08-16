"use client";

import { useMemo } from "react";
import { ArrowLeftRight, Scale, Trash2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useDeleteTransfer } from "@/lib/queries";
import type { Account, AccountAdjustment, AccountTransfer } from "@/types";

type ActivityRow =
  | { kind: "transfer"; date: string; created_at: string; transfer: AccountTransfer }
  | { kind: "adjustment"; date: string; created_at: string; adjustment: AccountAdjustment };

const MAX_ROWS = 12;

/** Recent transfers and reconciliation adjustments, newest first. */
export function AccountActivity({
  accounts,
  transfers,
  adjustments,
  currency,
}: {
  accounts: Account[];
  transfers: AccountTransfer[];
  adjustments: AccountAdjustment[];
  currency: string;
}) {
  const deleteTransfer = useDeleteTransfer();
  const nameOf = useMemo(
    () => new Map(accounts.map((a) => [a.id, a.name])),
    [accounts]
  );

  const rows: ActivityRow[] = useMemo(
    () =>
      [
        ...transfers.map((t) => ({
          kind: "transfer" as const,
          date: t.date,
          created_at: t.created_at ?? "",
          transfer: t,
        })),
        ...adjustments.map((a) => ({
          kind: "adjustment" as const,
          date: a.date,
          created_at: a.created_at ?? "",
          adjustment: a,
        })),
      ]
        .sort((a, b) => b.date.localeCompare(a.date) || b.created_at.localeCompare(a.created_at))
        .slice(0, MAX_ROWS),
    [transfers, adjustments]
  );

  return (
    <Card className="p-5 shadow-soft">
      <h3 className="mb-3 font-display text-sm font-bold tracking-tight">Activity</h3>

      {rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Transfers and reconciliations will show up here.
        </p>
      ) : (
        <ul className="divide-y divide-border/60">
          {rows.map((row) => (
            <li
              key={row.kind === "transfer" ? `t-${row.transfer.id}` : `a-${row.adjustment.id}`}
              className="group flex items-center gap-3 py-2.5"
            >
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-secondary text-muted-foreground">
                {row.kind === "transfer" ? (
                  <ArrowLeftRight className="h-3.5 w-3.5" />
                ) : (
                  <Scale className="h-3.5 w-3.5" />
                )}
              </span>

              <div className="min-w-0 flex-1">
                {row.kind === "transfer" ? (
                  <p className="truncate text-sm">
                    {nameOf.get(row.transfer.from_account_id) ?? "Deleted account"}
                    <span className="text-muted-foreground"> → </span>
                    {nameOf.get(row.transfer.to_account_id) ?? "Deleted account"}
                  </p>
                ) : (
                  <p className="truncate text-sm">
                    {nameOf.get(row.adjustment.account_id) ?? "Deleted account"}
                    <span className="text-muted-foreground">
                      {" "}
                      · {row.adjustment.note ?? "Adjustment"}
                    </span>
                  </p>
                )}
                <p className="text-xs text-muted-foreground">{row.date}</p>
              </div>

              <span
                className={cn(
                  "shrink-0 text-sm font-semibold tabular-nums",
                  row.kind === "adjustment" &&
                    (Number(row.adjustment.amount) < 0
                      ? "text-rose-600 dark:text-rose-400"
                      : "text-emerald-600 dark:text-emerald-400")
                )}
              >
                {row.kind === "transfer"
                  ? Number(row.transfer.amount).toLocaleString()
                  : `${Number(row.adjustment.amount) > 0 ? "+" : ""}${Number(
                      row.adjustment.amount
                    ).toLocaleString()}`}{" "}
                <span className="text-xs font-normal text-muted-foreground">{currency}</span>
              </span>

              {row.kind === "transfer" && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => deleteTransfer.mutate(row.transfer.id)}
                  className="h-7 w-7 shrink-0 p-0 text-muted-foreground opacity-0 transition-opacity hover:text-destructive group-hover:opacity-100"
                  title="Undo transfer"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              )}
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
