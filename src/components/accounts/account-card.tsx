"use client";

import { useState } from "react";
import { Archive, ArchiveRestore, Check, Scale, Trash2, X } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useDeleteAccount, useReconcileAccount, useUpdateAccount } from "@/lib/queries";
import { ACCOUNT_TYPES, type AccountBalance } from "@/lib/accounts";
import { AccountIcon } from "./account-icon";

export function AccountCard({
  summary,
  currency,
}: {
  summary: AccountBalance;
  currency: string;
}) {
  const { account, balance, txCount } = summary;
  const update = useUpdateAccount();
  const remove = useDeleteAccount();
  const reconcile = useReconcileAccount();

  const [reconciling, setReconciling] = useState(false);
  const [actual, setActual] = useState("");
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  const submitReconcile = () => {
    if (actual === "" || Number.isNaN(Number(actual))) return;
    // Work in cents so 0.1 + 0.2 drift never creates phantom adjustments.
    const delta = Math.round(Number(actual) * 100 - balance * 100) / 100;
    reconcile.mutate({ accountId: account.id, delta });
    setReconciling(false);
    setActual("");
  };

  const reconciledLabel = account.reconciled_at
    ? `reconciled ${new Date(account.reconciled_at).toLocaleDateString()}`
    : "never reconciled";

  return (
    <Card className={cn("space-y-4 p-5 shadow-soft", account.archived && "opacity-60")}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <AccountIcon type={account.type} />
          <div className="min-w-0">
            <h3 className="truncate font-display text-sm font-bold tracking-tight">
              {account.name}
            </h3>
            <p className="text-xs text-muted-foreground">
              {ACCOUNT_TYPES[account.type].label}
              {account.archived && " · archived"}
            </p>
          </div>
        </div>

        <div className="flex shrink-0 items-center">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() =>
              update.mutate({ id: account.id, patch: { archived: !account.archived } })
            }
            className="h-7 w-7 p-0 text-muted-foreground"
            title={account.archived ? "Restore account" : "Archive account"}
          >
            {account.archived ? (
              <ArchiveRestore className="h-3.5 w-3.5" />
            ) : (
              <Archive className="h-3.5 w-3.5" />
            )}
          </Button>
          {confirmingDelete ? (
            <>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => remove.mutate(account.id)}
                className="h-7 w-7 p-0 text-destructive"
                title={`Delete — ${txCount} linked transaction${txCount === 1 ? "" : "s"} will be kept but unlinked`}
              >
                <Check className="h-3.5 w-3.5" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setConfirmingDelete(false)}
                className="h-7 w-7 p-0"
                title="Cancel"
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            </>
          ) : (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setConfirmingDelete(true)}
              className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
              title="Delete account"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      </div>

      <div>
        <p
          className={cn(
            "font-display text-2xl font-extrabold tracking-tight tabular-nums",
            balance < 0 && "text-rose-600 dark:text-rose-400"
          )}
        >
          {balance.toLocaleString(undefined, { maximumFractionDigits: 2 })}
          <span className="ml-1.5 text-sm font-semibold text-muted-foreground">{currency}</span>
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          {txCount} transaction{txCount === 1 ? "" : "s"} · {reconciledLabel}
        </p>
      </div>

      {reconciling ? (
        <div className="flex items-center gap-2">
          <Input
            value={actual}
            onChange={(e) => setActual(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                submitReconcile();
              }
              if (e.key === "Escape") setReconciling(false);
            }}
            inputMode="decimal"
            placeholder={`Real balance (${currency})`}
            className="h-8 text-sm"
            autoFocus
          />
          <Button
            type="button"
            size="sm"
            onClick={submitReconcile}
            disabled={reconcile.isPending || actual === ""}
            className="h-8"
          >
            <Check className="h-3.5 w-3.5" />
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => setReconciling(false)}
            className="h-8"
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      ) : (
        !account.archived && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setReconciling(true)}
            className="w-full text-xs"
            title="Enter the real-world balance; the difference is recorded as an adjustment"
          >
            <Scale className="mr-1.5 h-3.5 w-3.5" />
            Reconcile
          </Button>
        )
      )}
    </Card>
  );
}
