// src/lib/savings.ts
// Pure, deterministic savings derivations. Contributions are set aside toward
// named goals; the money leaves the month's budget like an expense, so
// computeAnalytics subtracts them from the balance (they still aren't expense
// transactions — no category, no ledger row). Everything here is derived from
// (goals, contributions, viewed month) so the month navigator works the same
// way it does for the ledger.

import type { SavingsContribution, SavingsGoal } from "@/types";
import { prevMonthOf, shortMonth } from "@/lib/insights";

// Sky-led palette, distinct from expense rose and income emerald/lime.
export const GOAL_COLORS = [
  "#38bdf8", // sky
  "#a78bfa", // violet
  "#22d3ee", // cyan
  "#f472b6", // pink
  "#fbbf24", // amber
  "#34d399", // emerald
];

/** Pick the least-used palette color so goal colors stay distinct. */
export function nextGoalColor(existing: SavingsGoal[]): string {
  const counts = new Map(GOAL_COLORS.map((c) => [c, 0]));
  for (const g of existing) {
    if (counts.has(g.color)) counts.set(g.color, (counts.get(g.color) ?? 0) + 1);
  }
  let best = GOAL_COLORS[0];
  for (const [color, n] of counts) {
    if (n < (counts.get(best) ?? 0)) best = color;
  }
  return best;
}

export interface GoalSummary {
  goal: SavingsGoal;
  /** Saved up to and including the viewed month. */
  lifetimeTotal: number;
  /** Saved within the viewed month. */
  monthTotal: number;
  /** Allocation still unfunded this month (0 when no plan or already funded). */
  remainingThisMonth: number;
  /** True when a plan exists and this month's contributions cover it. */
  funded: boolean;
  /** lifetimeTotal / target, clamped to 0–1; null when the goal has no target. */
  targetPct: number | null;
}

export interface SavingsSummary {
  goals: GoalSummary[];
  monthTotal: number;
  lifetimeTotal: number;
  /** Sum of all monthly allocations (the plan). */
  plannedMonthly: number;
  /** Goals with a plan that are fully funded for the viewed month. */
  fundedCount: number;
  /** Goals that have a monthly allocation set. */
  plannedCount: number;
}

export function computeSavingsSummary(
  goals: SavingsGoal[],
  contributions: SavingsContribution[],
  month: string
): SavingsSummary {
  const byGoal = new Map<string, { lifetime: number; month: number }>();
  for (const c of contributions) {
    const m = c.date.slice(0, 7);
    if (m > month) continue; // future months don't exist yet from this view
    const acc = byGoal.get(c.goal_id) ?? { lifetime: 0, month: 0 };
    acc.lifetime += Number(c.amount);
    if (m === month) acc.month += Number(c.amount);
    byGoal.set(c.goal_id, acc);
  }

  const summaries: GoalSummary[] = goals.map((goal) => {
    const acc = byGoal.get(goal.id) ?? { lifetime: 0, month: 0 };
    const allocation = goal.monthly_allocation;
    const funded = allocation != null && acc.month >= allocation;
    return {
      goal,
      lifetimeTotal: acc.lifetime,
      monthTotal: acc.month,
      remainingThisMonth: allocation != null ? Math.max(0, allocation - acc.month) : 0,
      funded,
      targetPct:
        goal.target_amount != null && goal.target_amount > 0
          ? Math.min(1, acc.lifetime / goal.target_amount)
          : null,
    };
  });

  return {
    goals: summaries,
    monthTotal: summaries.reduce((s, g) => s + g.monthTotal, 0),
    lifetimeTotal: summaries.reduce((s, g) => s + g.lifetimeTotal, 0),
    plannedMonthly: goals.reduce((s, g) => s + (g.monthly_allocation ?? 0), 0),
    fundedCount: summaries.filter((g) => g.funded).length,
    plannedCount: goals.filter((g) => g.monthly_allocation != null).length,
  };
}

// ── Growth series (for the stacked cumulative chart) ─────────────────────────
export interface SavingsGrowthPoint {
  month: string;
  label: string;
  total: number;
  /** goal id → cumulative amount saved up to this month. */
  byGoal: Record<string, number>;
}

export function computeSavingsGrowth(
  goals: SavingsGoal[],
  contributions: SavingsContribution[],
  month: string,
  months = 6
): SavingsGrowthPoint[] {
  const window: string[] = [];
  let cur = month;
  for (let i = 0; i < months; i++) {
    window.unshift(cur);
    cur = prevMonthOf(cur);
  }
  const first = window[0];

  // One pass: per-goal balance carried into the window + per-goal-per-month sums.
  const base = new Map<string, number>();
  const monthly = new Map<string, number>(); // `${goalId}|${month}`
  for (const c of contributions) {
    const m = c.date.slice(0, 7);
    if (m < first) {
      base.set(c.goal_id, (base.get(c.goal_id) ?? 0) + Number(c.amount));
    } else if (m <= month) {
      const key = `${c.goal_id}|${m}`;
      monthly.set(key, (monthly.get(key) ?? 0) + Number(c.amount));
    }
  }

  const running = new Map(goals.map((g) => [g.id, base.get(g.id) ?? 0]));
  return window.map((m) => {
    const byGoal: Record<string, number> = {};
    let total = 0;
    for (const g of goals) {
      const next = (running.get(g.id) ?? 0) + (monthly.get(`${g.id}|${m}`) ?? 0);
      running.set(g.id, next);
      byGoal[g.id] = next;
      total += next;
    }
    return { month: m, label: shortMonth(m), total, byGoal };
  });
}
