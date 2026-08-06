// src/lib/insights.ts
// ─────────────────────────────────────────────────────────────────────────────
// "Expensio AI" — a smart, local insights engine.
// Pure, deterministic analysis of the user's real transactions: month-over-month
// category spikes, overspend & budget warnings, savings-rate coaching, burn-rate
// projection and concentration risk. No network, no API key — instant + free.
// ─────────────────────────────────────────────────────────────────────────────

import type { SavingsContribution, Transaction } from "@/types";

export type InsightTone =
  | "danger"
  | "warning"
  | "recommendation"
  | "positive"
  | "info";

export interface Insight {
  id: string;
  tone: InsightTone;
  title: string;
  detail: string;
  /** Short headline metric, e.g. "+64%". */
  metric?: string;
  category?: string;
  /** Higher = more important; used for ordering. */
  weight: number;
}

export interface Analytics {
  month: string;
  expenseTotal: number;
  incomeTotal: number;
  /** Contributions moved into savings goals this month. */
  savingsTotal: number;
  /** income − expenses − savings contributions. */
  balance: number;
  /** (income − expenses) / income, 0–1 — money not spent (saved or left over). */
  savingsRate: number;
  prevExpenseTotal: number;
  expenseDelta: number; // signed fraction vs last month
  topCategory: { name: string; amount: number; share: number } | null;
  dailyBurn: number;
  projectedExpense: number;
  daysElapsed: number;
  daysInMonth: number;
  largest: Transaction | null;
}

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function monthLabel(month: string) {
  const [y, m] = month.split("-").map(Number);
  return `${MONTH_NAMES[m - 1]} ${y}`;
}

export function shortMonth(month: string) {
  const [, m] = month.split("-").map(Number);
  return MONTH_NAMES[m - 1].slice(0, 3);
}

export function prevMonthOf(month: string): string {
  const [y, m] = month.split("-").map(Number);
  const d = new Date(y, m - 2, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function inMonth(items: Transaction[], month: string) {
  return items.filter((i) => i.date?.startsWith(month));
}

function sumByCategory(items: Transaction[]) {
  const map = new Map<string, number>();
  for (const i of items) {
    map.set(i.category, (map.get(i.category) ?? 0) + Number(i.amount));
  }
  return map;
}

function sum(items: Transaction[]) {
  return items.reduce((s, i) => s + Number(i.amount), 0);
}

function daysInMonthOf(month: string) {
  const [y, m] = month.split("-").map(Number);
  return new Date(y, m, 0).getDate();
}

/** How far into `month` we are (clamped to the month length; full month if past). */
function elapsedDays(month: string) {
  const now = new Date();
  const nowMonth = now.toISOString().slice(0, 7);
  const total = daysInMonthOf(month);
  if (month < nowMonth) return total; // a past month is fully elapsed
  if (month > nowMonth) return 0;
  return Math.min(now.getDate(), total);
}

/** Sum of savings contributions dated within `month`. */
function savingsInMonth(contributions: SavingsContribution[], month: string) {
  return contributions.reduce(
    (s, c) => (c.date?.startsWith(month) ? s + Number(c.amount) : s),
    0
  );
}

// ── Core analytics ───────────────────────────────────────────────────────────
export function computeAnalytics(
  expenses: Transaction[],
  income: Transaction[],
  month: string,
  contributions: SavingsContribution[] = []
): Analytics {
  const monthExp = inMonth(expenses, month);
  const monthInc = inMonth(income, month);
  const prevExp = inMonth(expenses, prevMonthOf(month));

  const expenseTotal = sum(monthExp);
  const incomeTotal = sum(monthInc);
  const prevExpenseTotal = sum(prevExp);
  const savingsTotal = savingsInMonth(contributions, month);
  // Money set aside for goals leaves the month's budget just like an expense.
  const balance = incomeTotal - expenseTotal - savingsTotal;
  const savingsRate = incomeTotal > 0 ? (incomeTotal - expenseTotal) / incomeTotal : 0;
  const expenseDelta =
    prevExpenseTotal > 0 ? (expenseTotal - prevExpenseTotal) / prevExpenseTotal : 0;

  const cats = [...sumByCategory(monthExp)].sort((a, b) => b[1] - a[1]);
  const topCategory = cats.length
    ? {
        name: cats[0][0],
        amount: cats[0][1],
        share: expenseTotal > 0 ? cats[0][1] / expenseTotal : 0,
      }
    : null;

  const daysElapsed = elapsedDays(month);
  const daysInMonth = daysInMonthOf(month);
  const dailyBurn = daysElapsed > 0 ? expenseTotal / daysElapsed : 0;
  const projectedExpense = daysElapsed > 0 ? dailyBurn * daysInMonth : expenseTotal;

  const largest =
    monthExp.length > 0
      ? monthExp.reduce((a, b) => (Number(b.amount) > Number(a.amount) ? b : a))
      : null;

  return {
    month,
    expenseTotal,
    incomeTotal,
    savingsTotal,
    balance,
    savingsRate,
    prevExpenseTotal,
    expenseDelta,
    topCategory,
    dailyBurn,
    projectedExpense,
    daysElapsed,
    daysInMonth,
    largest,
  };
}

// ── 6-month trend (for analytics charts) ─────────────────────────────────────
export interface TrendPoint {
  month: string;
  label: string;
  expense: number;
  income: number;
  /** Contributions moved into savings goals that month. */
  savings: number;
  /** income − expenses − savings contributions. */
  net: number;
}

export function computeTrend(
  expenses: Transaction[],
  income: Transaction[],
  month: string,
  months = 6,
  contributions: SavingsContribution[] = []
): TrendPoint[] {
  const out: TrendPoint[] = [];
  let cur = month;
  for (let i = 0; i < months; i++) {
    const expense = sum(inMonth(expenses, cur));
    const incomeT = sum(inMonth(income, cur));
    const saved = savingsInMonth(contributions, cur);
    out.unshift({
      month: cur,
      label: shortMonth(cur),
      expense,
      income: incomeT,
      savings: saved,
      net: incomeT - expense - saved,
    });
    cur = prevMonthOf(cur);
  }
  return out;
}

// ── Insight generation ───────────────────────────────────────────────────────
const pct = (n: number) => `${n > 0 ? "+" : ""}${Math.round(n * 100)}%`;

export function generateInsights(
  expenses: Transaction[],
  income: Transaction[],
  month: string,
  currency: string,
  contributions: SavingsContribution[] = []
): Insight[] {
  const a = computeAnalytics(expenses, income, month, contributions);
  const money = (n: number) => `${Math.round(n).toLocaleString()} ${currency}`;
  const out: Insight[] = [];

  const monthExp = inMonth(expenses, month);
  const prevExp = inMonth(expenses, prevMonthOf(month));

  // Nothing to analyse yet.
  if (monthExp.length === 0 && inMonth(income, month).length === 0) {
    out.push({
      id: "empty",
      tone: "info",
      title: "Add a few transactions to unlock insights",
      detail:
        "Expensio AI watches your spending patterns and flags risks the moment they appear. Log this month's expenses to begin.",
      weight: 0,
    });
    return out;
  }

  // 1. Spending (incl. savings set aside) exceeds income (most severe).
  if (a.balance < 0) {
    out.push({
      id: "deficit",
      tone: "danger",
      title: "You're spending more than you earn",
      detail: `${
        a.savingsTotal > 0 ? "Expenses plus savings contributions are" : "Expenses are"
      } ${money(-a.balance)} over your income for ${monthLabel(
        month
      )}. Trim discretionary categories before month-end.`,
      metric: money(a.balance),
      weight: 100,
    });
  }

  // 2. Burn-rate projection — heading for an overspend even if not there yet.
  else if (
    a.daysElapsed > 2 &&
    a.daysElapsed < a.daysInMonth &&
    a.incomeTotal > 0 &&
    a.projectedExpense > a.incomeTotal
  ) {
    out.push({
      id: "projection",
      tone: "warning",
      title: "On track to overspend this month",
      detail: `At ${money(a.dailyBurn)}/day you're projected to spend ${money(
        a.projectedExpense
      )} by ${monthLabel(month).split(" ")[0]} ${a.daysInMonth} — above your ${money(
        a.incomeTotal
      )} income.`,
      metric: money(a.projectedExpense),
      weight: 80,
    });
  }

  // 3. Category spikes vs last month.
  if (prevExp.length > 0) {
    const cur = sumByCategory(monthExp);
    const prev = sumByCategory(prevExp);
    const spikes: { cat: string; delta: number; amt: number }[] = [];
    for (const [cat, amt] of cur) {
      const before = prev.get(cat) ?? 0;
      if (before > 0 && amt > before * 1.25 && amt - before >= 50) {
        spikes.push({ cat, delta: (amt - before) / before, amt });
      }
    }
    spikes.sort((x, y) => y.delta - x.delta);
    if (spikes[0]) {
      const s = spikes[0];
      out.push({
        id: `spike-${s.cat}`,
        tone: "warning",
        title: `${formatCat(s.cat)} spending jumped`,
        detail: `${formatCat(s.cat)} is up ${pct(s.delta)} vs last month, now ${money(
          s.amt
        )}. Worth a closer look.`,
        metric: pct(s.delta),
        category: s.cat,
        weight: 70,
      });
    }
  }

  // 4. Concentration risk — one category dominates.
  if (a.topCategory && a.topCategory.share >= 0.4 && a.expenseTotal > 0) {
    out.push({
      id: "concentration",
      tone: "recommendation",
      title: `${formatCat(a.topCategory.name)} dominates your budget`,
      detail: `${Math.round(a.topCategory.share * 100)}% of spending (${money(
        a.topCategory.amount
      )}) goes to ${formatCat(
        a.topCategory.name
      )}. Setting a cap here is the fastest way to free up cash.`,
      metric: `${Math.round(a.topCategory.share * 100)}%`,
      category: a.topCategory.name,
      weight: 55,
    });
  }

  // 5. Savings-rate coaching (money not spent = goal contributions + leftover).
  if (a.incomeTotal > 0) {
    const kept = a.incomeTotal - a.expenseTotal;
    if (a.savingsRate >= 0.2) {
      out.push({
        id: "savings-good",
        tone: "positive",
        title: "Healthy savings rate",
        detail: `You're keeping ${Math.round(
          a.savingsRate * 100
        )}% of your income — ${money(kept)} not spent this month${
          a.savingsTotal > 0 ? `, ${money(a.savingsTotal)} of it in savings goals` : ""
        }. Keep it up.`,
        metric: `${Math.round(a.savingsRate * 100)}%`,
        weight: 40,
      });
    } else if (a.savingsRate > 0 && a.savingsRate < 0.1) {
      out.push({
        id: "savings-thin",
        tone: "recommendation",
        title: "Your buffer is thin",
        detail: `Only ${Math.round(
          a.savingsRate * 100
        )}% of income is left over. Aim for 20% — that's about ${money(
          a.incomeTotal * 0.2 - kept
        )} more to set aside.`,
        metric: `${Math.round(a.savingsRate * 100)}%`,
        weight: 50,
      });
    }
  }

  // 6. Spending fell vs last month — reinforce the win.
  if (a.prevExpenseTotal > 0 && a.expenseDelta <= -0.1) {
    out.push({
      id: "down",
      tone: "positive",
      title: "Spending is trending down",
      detail: `You spent ${pct(a.expenseDelta)} less than last month — ${money(
        a.prevExpenseTotal - a.expenseTotal
      )} saved versus ${monthLabel(prevMonthOf(month))}.`,
      metric: pct(a.expenseDelta),
      weight: 35,
    });
  }

  // 7. Largest single charge worth noticing.
  if (a.largest && a.expenseTotal > 0 && Number(a.largest.amount) >= a.expenseTotal * 0.25) {
    out.push({
      id: "largest",
      tone: "info",
      title: "One big charge stands out",
      detail: `"${a.largest.name}" (${formatCat(a.largest.category)}) was ${money(
        Number(a.largest.amount)
      )} — ${Math.round((Number(a.largest.amount) / a.expenseTotal) * 100)}% of the month.`,
      metric: money(Number(a.largest.amount)),
      category: a.largest.category,
      weight: 25,
    });
  }

  if (out.length === 0) {
    out.push({
      id: "steady",
      tone: "positive",
      title: "Everything looks steady",
      detail: `No red flags for ${monthLabel(
        month
      )}. Your spending is in line with your income and recent history.`,
      weight: 10,
    });
  }

  return out.sort((x, y) => y.weight - x.weight);
}

function formatCat(c: string) {
  return c.charAt(0).toUpperCase() + c.slice(1);
}
