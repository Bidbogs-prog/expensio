// Shared presentation config for the two transaction kinds (expense / income).
// Keeping this in one place lets the form, table and chart stay fully unified.

export type TxKind = "expense" | "income";

export interface TxConfig {
  kind: TxKind;
  title: string;
  subtitle: string;
  addHeading: string;
  addSubheading: string;
  /** Label for the free-text "name" field, e.g. "Expense name". */
  nameLabel: string;
  namePlaceholder: string;
  /** Table column header for the name field, e.g. "Item" / "Source". */
  nameColumn: string;
  emptyTitle: string;
  emptyHint: string;
  totalLabel: string;
  defaultCategories: string[];
  /** Tailwind classes for the colored amount text. */
  amountClass: string;
  /** Tailwind classes for the small category dot. */
  dotClass: string;
  /** Tailwind classes for the icon chip background. */
  chipClass: string;
  /** Color palette used for the pie chart slices. */
  palette: string[];
  /** Expenses are stored lower-cased; income keeps its original casing. */
  normalizeCategory: (value: string) => string;
}

const EXPENSE_PALETTE = [
  "#f43f5e", // rose
  "#fb923c", // orange
  "#f59e0b", // amber
  "#a855f7", // purple
  "#ec4899", // pink
  "#6366f1", // indigo
  "#14b8a6", // teal
];

const INCOME_PALETTE = [
  "#10b981", // emerald
  "#14b8a6", // teal
  "#06b6d4", // cyan
  "#3b82f6", // blue
  "#6366f1", // indigo
  "#8b5cf6", // violet
  "#f59e0b", // amber
];

export const TX_CONFIG: Record<TxKind, TxConfig> = {
  expense: {
    kind: "expense",
    title: "Expenses",
    subtitle: "Track and manage your spending",
    addHeading: "Add expense",
    addSubheading: "Record a new expense",
    nameLabel: "Expense name",
    namePlaceholder: "e.g. Groceries, Taxi",
    nameColumn: "Item",
    emptyTitle: "No expenses yet",
    emptyHint: "Add your first expense using the form above",
    totalLabel: "Total expenses",
    defaultCategories: ["food", "transport", "bills", "entertainment"],
    amountClass: "text-rose-600 dark:text-rose-400",
    dotClass: "bg-rose-500",
    chipClass: "bg-rose-100 text-rose-600 dark:bg-rose-500/15 dark:text-rose-400",
    palette: EXPENSE_PALETTE,
    normalizeCategory: (v) => v.trim().toLowerCase(),
  },
  income: {
    kind: "income",
    title: "Income",
    subtitle: "Track and manage your income sources",
    addHeading: "Add income",
    addSubheading: "Record a new income source",
    nameLabel: "Income name",
    namePlaceholder: "e.g. Salary, Bonus",
    nameColumn: "Source",
    emptyTitle: "No income yet",
    emptyHint: "Add your first income source using the form above",
    totalLabel: "Total income",
    defaultCategories: ["Freelance", "9 to 5", "Business", "Rent"],
    amountClass: "text-emerald-600 dark:text-emerald-400",
    dotClass: "bg-emerald-500",
    chipClass:
      "bg-emerald-100 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400",
    palette: INCOME_PALETTE,
    normalizeCategory: (v) => v.trim(),
  },
};

/** Title-case a category label for display. */
export function formatCategory(category: string): string {
  return category.charAt(0).toUpperCase() + category.slice(1);
}

/** Deterministically map a category name to a palette color so colors stay stable. */
export function colorForCategory(category: string, palette: string[]): string {
  let hash = 0;
  for (let i = 0; i < category.length; i++) {
    hash = (hash * 31 + category.charCodeAt(i)) >>> 0;
  }
  return palette[hash % palette.length];
}
