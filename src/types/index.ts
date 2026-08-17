// src/types/index.ts — single source of truth for all domain types

// ── Currency ─────────────────────────────────────────────────────────────────
export type Currency = "USD" | "MAD" | "EUR";

// ── Database models ───────────────────────────────────────────────────────────
export interface Transaction {
  id: number
  user_id: string;
  category: string;
  name: string;
  /** Negative = refund (expense) or correction (income). Never zero. */
  amount: number;
  created_at?: string;
  date: string;
  /** null/undefined = personal; a group id = shared family transaction. */
  group_id?: string | null;
  /** Account the money moved through; null = untracked. */
  account_id?: string | null;
  /** Merchant / counterparty, e.g. "Marjane", "CIH ATM". */
  payee?: string | null;
  note?: string | null;
  tags?: string[];
  /** Path inside the private `receipts` storage bucket. */
  receipt_path?: string | null;
}

export interface Expense extends Transaction {}
export interface Income extends Transaction {}

// ── Accounts (where money lives) ─────────────────────────────────────────────
export type AccountType = "checking" | "card" | "cash" | "other";

/** A place money lives. Personal-only — accounts are never shared with groups. */
export interface Account {
  id: string;
  user_id: string;
  name: string;
  type: AccountType;
  /** Balance when the account was added; negative allowed (card debt). */
  opening_balance: number;
  /** SyncSource abstraction: 'manual' today; future import/BAM adapters later. */
  sync_source: string;
  archived: boolean;
  /** Last time the user reconciled against the real-world balance. */
  reconciled_at?: string | null;
  created_at?: string;
}

/** Money moved between two of the user's own accounts (not income/expense). */
export interface AccountTransfer {
  id: string;
  user_id: string;
  from_account_id: string;
  to_account_id: string;
  amount: number;
  date: string;
  note?: string | null;
  created_at?: string;
}

/** Signed reconciliation correction (positive = app under-counted). */
export interface AccountAdjustment {
  id: string;
  user_id: string;
  account_id: string;
  amount: number;
  date: string;
  note?: string | null;
  created_at?: string;
}

/** Minimal ledger row used to derive account balances (all scopes, all months). */
export interface AccountLedgerEntry {
  account_id: string;
  amount: number;
  kind: "expense" | "income";
}

// ── Budget / category templates ───────────────────────────────────────────────
/** One fixed line item inside a template. */
export interface TemplateItem {
  category: string;
  name: string;
  amount: number;
}

export interface BudgetTemplate {
  id: string;
  user_id: string;
  /** null = personal template; a group id = shared family template. */
  group_id: string | null;
  kind: "expense" | "income";
  name: string;
  items: TemplateItem[];
  /** Auto-insert items on the 1st of each month (via pg_cron). */
  auto_apply?: boolean;
  /** 'YYYY-MM' the auto-run last applied; set on enable to skip the current month. */
  last_applied?: string | null;
  created_at?: string;
}

// ── Savings goals ─────────────────────────────────────────────────────────────
/** A named savings jar. Contributions to it are NOT expenses. */
export interface SavingsGoal {
  id: string;
  user_id: string;
  name: string;
  /** Lifetime target; null = open-ended goal. */
  target_amount: number | null;
  /** Planned amount to set aside each month; null = no plan. */
  monthly_allocation: number | null;
  /** Hex color used on cards and charts. */
  color: string;
  /** null/undefined = personal; a group id = shared family goal. */
  group_id?: string | null;
  created_at?: string;
}

/** One amount set aside toward a goal on a date. */
export interface SavingsContribution {
  id: number;
  user_id: string;
  goal_id: string;
  amount: number;
  date: string;
  /** Mirrors the goal's scope; stamped server-side by trigger. */
  group_id?: string | null;
  created_at?: string;
}

/** Monthly spending limit for one expense category (personal or group scope). */
export interface CategoryBudget {
  id: string;
  user_id: string;
  /** null = personal budget; a group id = shared family budget. */
  group_id: string | null;
  category: string;
  monthly_limit: number;
  created_at?: string;
}

/** Per-kind category name lists, e.g. { expense: ["coffee"], income: [] }. */
export interface CategoryPrefs {
  expense?: string[];
  income?: string[];
}

export interface UserSettings {
  id?: number;
  user_id: string;
  currency: Currency;
  /** User-created categories that should appear even with no transactions. */
  custom_categories?: CategoryPrefs;
  /** Deleted/hidden categories (including hidden defaults). */
  hidden_categories?: CategoryPrefs;
  created_at?: string;
  updated_at?: string;
}

// ── Family groups ─────────────────────────────────────────────────────────────
export interface Profile {
  id: string;
  email: string | null;
  full_name: string | null;
  avatar_url: string | null;
}

/** 'family' shares expenses AND income; 'housemates' shares expenses only. */
export type GroupType = "family" | "housemates";

export interface Group {
  id: string;
  name: string;
  owner_id: string;
  /** Defaults to 'family' for groups created before types existed. */
  type?: GroupType;
  /** Track who-owes-whom for shared expenses. Off for pooled-money households. */
  settle_up?: boolean;
  created_at?: string;
}

/** A housemate's "I sent my share" check-off on a shared expense. */
export interface ExpenseContribution {
  expense_id: number;
  user_id: string;
  confirmed_at?: string;
}

export interface GroupMember {
  user_id: string;
  role: string;
  joined_at?: string;
  profile: Profile | null;
}

/** Row returned by the incoming_invites() RPC. */
export interface IncomingInvite {
  invite_id: string;
  group_id: string;
  group_name: string;
  inviter_name: string | null;
  inviter_email: string | null;
  created_at: string;
}

/** Row returned by the group_pending_invites() RPC. */
export interface PendingInvite {
  invite_id: string;
  invitee_id: string;
  invitee_name: string | null;
  invitee_email: string | null;
  status: string;
}

// ── Form value types (inferred from Zod schemas in form-schemas.ts) ──────────
// Re-exported here so all consumers import from one place.
export type {
  ExpenseFormValues,
  IncomeFormValues,
  SavingsGoalFormValues,
} from "@/form-schemas";
