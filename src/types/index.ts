// src/types/index.ts — single source of truth for all domain types

// ── Currency ─────────────────────────────────────────────────────────────────
export type Currency = "USD" | "MAD" | "EUR";

// ── Database models ───────────────────────────────────────────────────────────
export interface Transaction {
  id: number
  user_id: string;
  category: string;
  name: string;
  amount: number;
  created_at?: string;
  date: string;
  /** null/undefined = personal; a group id = shared family transaction. */
  group_id?: string | null;
}

export interface Expense extends Transaction {}
export interface Income extends Transaction {}

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

export interface UserSettings {
  id?: number;
  user_id: string;
  currency: Currency;
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

export interface Group {
  id: string;
  name: string;
  owner_id: string;
  created_at?: string;
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
