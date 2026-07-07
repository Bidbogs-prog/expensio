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
export type { ExpenseFormValues, IncomeFormValues } from "@/form-schemas";
