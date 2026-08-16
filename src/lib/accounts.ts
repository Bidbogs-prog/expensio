// src/lib/accounts.ts
// Pure account derivations + per-type presentation config. An account's
// balance is fully derived — opening balance, then every linked ledger row,
// transfer and reconciliation adjustment replayed on top — so it can never
// drift from the data.

import type {
  Account,
  AccountAdjustment,
  AccountLedgerEntry,
  AccountTransfer,
  AccountType,
} from "@/types";

export interface AccountTypeMeta {
  label: string;
  /** Short hint shown in the type picker. */
  hint: string;
  /** Tailwind classes for the icon chip (dark-safe pairs). */
  chipClass: string;
}

export const ACCOUNT_TYPES: Record<AccountType, AccountTypeMeta> = {
  checking: {
    label: "Bank account",
    hint: "Checking / current account",
    chipClass: "bg-indigo-100 text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-400",
  },
  card: {
    label: "Card",
    hint: "Debit or prepaid card",
    chipClass: "bg-violet-100 text-violet-600 dark:bg-violet-500/15 dark:text-violet-400",
  },
  cash: {
    label: "Cash",
    hint: "Wallet / cash on hand",
    chipClass: "bg-amber-100 text-amber-600 dark:bg-amber-500/15 dark:text-amber-400",
  },
  other: {
    label: "Other",
    hint: "Anything else holding money",
    chipClass: "bg-slate-100 text-slate-600 dark:bg-slate-500/15 dark:text-slate-400",
  },
};

export const ACCOUNT_TYPE_ORDER: AccountType[] = ["checking", "card", "cash", "other"];

export interface AccountBalance {
  account: Account;
  /** opening + income − expenses + transfers in − transfers out + adjustments. */
  balance: number;
  /** Linked ledger rows (expenses + income) hitting this account. */
  txCount: number;
}

export function computeAccountBalances(
  accounts: Account[],
  ledger: AccountLedgerEntry[],
  transfers: AccountTransfer[],
  adjustments: AccountAdjustment[]
): Map<string, AccountBalance> {
  const balances = new Map<string, AccountBalance>(
    accounts.map((a) => [a.id, { account: a, balance: Number(a.opening_balance), txCount: 0 }])
  );

  for (const e of ledger) {
    const acc = balances.get(e.account_id);
    if (!acc) continue;
    acc.balance += e.kind === "income" ? Number(e.amount) : -Number(e.amount);
    acc.txCount += 1;
  }
  for (const t of transfers) {
    const from = balances.get(t.from_account_id);
    const to = balances.get(t.to_account_id);
    if (from) from.balance -= Number(t.amount);
    if (to) to.balance += Number(t.amount);
  }
  for (const adj of adjustments) {
    const acc = balances.get(adj.account_id);
    if (acc) acc.balance += Number(adj.amount);
  }

  return balances;
}

/** Sum of active (non-archived) balances, optionally for one type. */
export function totalBalance(
  balances: Map<string, AccountBalance>,
  type?: AccountType
): number {
  let total = 0;
  for (const b of balances.values()) {
    if (b.account.archived) continue;
    if (type && b.account.type !== type) continue;
    total += b.balance;
  }
  return total;
}

/** Sorted for display: active before archived, then by type, then by creation. */
export function sortAccounts(accounts: Account[]): Account[] {
  return [...accounts].sort((a, b) => {
    if (a.archived !== b.archived) return a.archived ? 1 : -1;
    const t = ACCOUNT_TYPE_ORDER.indexOf(a.type) - ACCOUNT_TYPE_ORDER.indexOf(b.type);
    if (t !== 0) return t;
    return (a.created_at ?? "").localeCompare(b.created_at ?? "");
  });
}
