// src/types/index.ts — single source of truth for all domain types

// ── Currency ─────────────────────────────────────────────────────────────────
export type Currency = "USD" | "MAD" | "EUR";

// ── Database models ───────────────────────────────────────────────────────────
export interface Transaction {
  id?: number 
  user_id?: string;
  category: string;
  name: string;
  amount: number;
  created_at?: string;
}

export interface Expense extends Transaction {}
export interface Income extends Transaction {}

export interface UserSettings {
  id?: number;
  user_id: string;
  currency: Currency;
  created_at?: string;
  updated_at?: string;
}

// ── Form value types (inferred from Zod schemas in form-schemas.ts) ──────────
// Re-exported here so all consumers import from one place.
export type { ExpenseFormValues, IncomeFormValues } from "@/form-schemas";
