import { z } from "zod";

// Shared optional detail fields (payee, note, tags, account, receipt).
const txDetails = {
  /** Account id the money moved through; empty/undefined = untracked. */
  account: z.string().optional(),
  payee: z.string().max(60, "Payee must be less than 60 characters").optional(),
  note: z.string().max(300, "Note must be less than 300 characters").optional(),
  /** Comma-separated in the form; converted to text[] in the payload. */
  tags: z.string().max(120, "Too many tags").optional(),
  /** Storage path set after a receipt upload. */
  receipt: z.string().optional(),
};

// Negative = refund/correction; zero is meaningless.
const amountSchema = z
  .string()
  .min(1, "Amount is required")
  .regex(/^-?\d+(\.\d{1,2})?$/, "Must be a valid amount (max 2 decimal places)")
  .refine((v) => Number(v) !== 0, "Amount can't be zero");

export const incomeFormSchema = z.object({
  category: z.string({
    required_error: "Please select a category",
  }),
  name: z
    .string()
    .min(1, "Income name is required")
    .max(50, "Income name must be less than 50 characters"),
  amount: amountSchema,
  date: z.string().refine((val) => {
    const parsedDate = Date.parse(val);
    return !isNaN(parsedDate);
  }, "Must be a valid date"),
  ...txDetails,
});

export const expenseFormSchema = z.object({
  category: z.string({
    required_error: "Please select a category",
  }),
  name: z
    .string()
    .min(1, "Expense name is required")
    .max(50, "Expense name must be less than 50 characters"),
  amount: amountSchema,
  date: z.string().refine((val) => {
    const parsedDate = Date.parse(val);
    return !isNaN(parsedDate);
  }, "Must be a valid date"),
  ...txDetails,
});

export const savingsGoalFormSchema = z.object({
  name: z
    .string()
    .min(1, "Goal name is required")
    .max(50, "Goal name must be less than 50 characters"),
  // Optional numeric fields — empty string means "not set".
  target: z.string().regex(/^(\d+(\.\d{1,2})?)?$/, "Must be a valid amount"),
  allocation: z.string().regex(/^(\d+(\.\d{1,2})?)?$/, "Must be a valid amount"),
});

export const accountFormSchema = z.object({
  name: z
    .string()
    .min(1, "Account name is required")
    .max(40, "Account name must be less than 40 characters"),
  type: z.enum(["checking", "card", "cash", "other"]),
  // Optional signed amount — cards can start in the red; empty = 0.
  opening: z
    .string()
    .regex(/^-?(\d+(\.\d{1,2})?)?$/, "Must be a valid amount"),
});

export type IncomeFormValues = z.infer<typeof incomeFormSchema>;
export type ExpenseFormValues = z.infer<typeof expenseFormSchema>;
export type SavingsGoalFormValues = z.infer<typeof savingsGoalFormSchema>;
export type AccountFormValues = z.infer<typeof accountFormSchema>;
