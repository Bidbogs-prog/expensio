"use client";

// ─────────────────────────────────────────────────────────────────────────────
// Freemium plan state (demo billing). Persists to localStorage so the Pro
// experience can be shown end-to-end without a real payment provider wired up.
// ─────────────────────────────────────────────────────────────────────────────

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { UpgradeDialog } from "@/components/upgrade-dialog";

export type Plan = "free" | "pro";

// Versioned, namespaced storage key so the schema can evolve safely.
const PLAN_STORAGE_KEY = "expensio.plan.v1";

export const FREE_LIMITS = {
  /** Insights visible before the upgrade wall. */
  insights: 2,
  /** Months of history a free user can scroll back through. */
  historyMonths: 2,
};

interface PlanContextValue {
  plan: Plan;
  isPro: boolean;
  upgrade: () => void;
  downgrade: () => void;
  /** Open the pricing modal (optionally tagged with the feature that triggered it). */
  openUpgrade: (feature?: string) => void;
}

const PlanContext = createContext<PlanContextValue | null>(null);

export function PlanProvider({ children }: { children: ReactNode }) {
  const [plan, setPlan] = useState<Plan>("free");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [feature, setFeature] = useState<string | undefined>();

  useEffect(() => {
    try {
      const saved = localStorage.getItem(PLAN_STORAGE_KEY);
      if (saved === "pro" || saved === "free") setPlan(saved);
    } catch {
      /* ignore */
    }
  }, []);

  const persist = (next: Plan) => {
    setPlan(next);
    try {
      localStorage.setItem(PLAN_STORAGE_KEY, next);
    } catch {
      /* ignore */
    }
  };

  const value: PlanContextValue = {
    plan,
    isPro: plan === "pro",
    upgrade: () => {
      persist("pro");
      setDialogOpen(false);
    },
    downgrade: () => persist("free"),
    openUpgrade: (f?: string) => {
      setFeature(f);
      setDialogOpen(true);
    },
  };

  return (
    <PlanContext.Provider value={value}>
      {children}
      <UpgradeDialog
        open={dialogOpen}
        feature={feature}
        onClose={() => setDialogOpen(false)}
        onUpgrade={value.upgrade}
      />
    </PlanContext.Provider>
  );
}

export function usePlan() {
  const ctx = useContext(PlanContext);
  if (!ctx) throw new Error("usePlan must be used within PlanProvider");
  return ctx;
}
