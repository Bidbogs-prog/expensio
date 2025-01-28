import { z } from "zod";

export const incomeFormSchema = z.object({
  income: z
    .string()
    .min(1, "Income is required")
    .regex(/^\d+$/, "Must be a valid number"),
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
    .regex(/^\d+$/, "Must be a valid number"),
});

export type IncomeFormValues = z.infer<typeof incomeFormSchema>;
export type ExpenseFormValues = z.infer<typeof expenseFormSchema>;
