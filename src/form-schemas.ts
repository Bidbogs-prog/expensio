import { z } from "zod";

export const incomeFormSchema = z.object({
  category: z.string({
    required_error: "Please select a category",
  }),
  name: z
    .string()
    .min(1, "Income name is required")
    .max(50, "Income name must be less than 50 characters"),
  amount: z
    .string()
    .min(1, "Amount is required")
    .regex(/^\d+(\.\d{1,2})?$/, "Must be a valid amount (max 2 decimal places)"),
  date: z.string().refine((val) => {
    const parsedDate = Date.parse(val);
    return !isNaN(parsedDate);
  }, "Must be a valid date"),
});

export const expenseFormSchema = z.object({
  category: z.string({
    required_error: "Please select a category",
  }),
  name: z
    .string()
    .min(1, "Expense name is required")
    .max(50, "Expense name must be less than 50 characters"),
  amount: z
    .string()
    .min(1, "Amount is required")
    .regex(/^\d+(\.\d{1,2})?$/, "Must be a valid amount (max 2 decimal places)"),
  date: z.string().refine((val) => {
    const parsedDate = Date.parse(val);
    return !isNaN(parsedDate);
  }, "Must be a valid date"),
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

export type IncomeFormValues = z.infer<typeof incomeFormSchema>;
export type ExpenseFormValues = z.infer<typeof expenseFormSchema>;
export type SavingsGoalFormValues = z.infer<typeof savingsGoalFormSchema>;
