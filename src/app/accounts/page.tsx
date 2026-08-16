"use client";

import { useMemo } from "react";
import { AlertTriangle, Banknote, Landmark, Layers } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { CurrencySelect } from "@/components/currency-select";
import { StatCard } from "@/components/stat-card";
import { Card } from "@/components/ui/card";
import { AccountCard } from "@/components/accounts/account-card";
import { AccountForm } from "@/components/accounts/account-form";
import { TransferForm } from "@/components/accounts/transfer-form";
import { AccountActivity } from "@/components/accounts/account-activity";
import {
  useAccountAdjustments,
  useAccountLedger,
  useAccounts,
  useCurrency,
  useTransfers,
} from "@/lib/queries";
import { computeAccountBalances, sortAccounts, totalBalance } from "@/lib/accounts";
import { useUiStore } from "@/hooks/use-ui-store";

export default function AccountsPage() {
  const error = useUiStore((s) => s.error);
  const currency = useCurrency();

  const { data: accounts = [] } = useAccounts();
  const { data: ledger = [] } = useAccountLedger();
  const { data: transfers = [] } = useTransfers();
  const { data: adjustments = [] } = useAccountAdjustments();

  const balances = useMemo(
    () => computeAccountBalances(accounts, ledger, transfers, adjustments),
    [accounts, ledger, transfers, adjustments]
  );
  const sorted = useMemo(() => sortAccounts(accounts), [accounts]);
  const active = sorted.filter((a) => !a.archived);
  const archivedCount = accounts.length - active.length;

  const net = totalBalance(balances);
  const cash = totalBalance(balances, "cash");

  return (
    <div className="min-h-screen">
      <PageHeader
        eyebrow="Where money lives"
        title="Accounts"
        subtitle="Bank, card and cash balances — reconciled against the real world"
      >
        <CurrencySelect />
      </PageHeader>

      <div className="mx-auto w-full max-w-6xl space-y-6 px-4 py-6 sm:px-6">
        {error && (
          <Card className="flex items-center gap-3 border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
            <AlertTriangle className="h-5 w-5 shrink-0" />
            {error}
          </Card>
        )}

        {/* Stat row */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
          <StatCard
            label="Net balance"
            value={Math.round(net)}
            unit={currency}
            icon={Landmark}
            tone="accent"
            featured
            beam
            hint={
              <span className="text-xs text-muted-foreground">
                across your active accounts
              </span>
            }
          />
          <StatCard
            label="Cash on hand"
            value={Math.round(cash)}
            unit={currency}
            icon={Banknote}
            tone="neutral"
            hint={
              <span className="text-xs text-muted-foreground">
                cash-type accounts only
              </span>
            }
          />
          <StatCard
            label="Accounts"
            value={active.length}
            icon={Layers}
            tone="neutral"
            hint={
              <span className="text-xs text-muted-foreground">
                {archivedCount > 0
                  ? `${archivedCount} archived`
                  : "add every place money lives"}
              </span>
            }
          />
        </div>

        {/* Account cards */}
        <div>
          <h2 className="mb-3 font-display text-lg font-bold tracking-tight">
            Your accounts
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {sorted.map((a) => {
              const summary = balances.get(a.id);
              return summary ? (
                <AccountCard key={a.id} summary={summary} currency={currency} />
              ) : null;
            })}
            <AccountForm currency={currency} />
          </div>
        </div>

        {/* Transfers + activity */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {active.length >= 2 ? (
            <TransferForm accounts={active} currency={currency} />
          ) : (
            <Card className="flex items-center justify-center p-5 text-sm text-muted-foreground shadow-soft">
              Add a second account to move money between them.
            </Card>
          )}
          <AccountActivity
            accounts={accounts}
            transfers={transfers}
            adjustments={adjustments}
            currency={currency}
          />
        </div>
      </div>
    </div>
  );
}
