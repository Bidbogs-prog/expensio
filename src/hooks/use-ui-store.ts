// src/hooks/use-ui-store.ts
// Tiny client-only UI state. Server state (expenses, income, settings) lives in
// React Query — this store holds only ephemeral view state.
import { create } from "zustand";

interface UiState {
  /** Selected month in "YYYY-MM" form. */
  currentMonth: string;
  /** Transient error banner text (set by mutation failures, auto-cleared). */
  error: string | null;
  setCurrentMonth: (month: string) => void;
  setError: (error: string | null) => void;
}

export const useUiStore = create<UiState>((set) => ({
  currentMonth: new Date().toISOString().slice(0, 7),
  error: null,
  setCurrentMonth: (currentMonth) => set({ currentMonth }),
  setError: (error) => set({ error }),
}));
