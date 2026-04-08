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
    .regex(/^\d+$/, "Must be a valid number"),
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
    .regex(/^\d+$/, "Must be a valid number"),
  date: z.string().refine((val) => {
    const parsedDate = Date.parse(val);
    return !isNaN(parsedDate);
  }, "Must be a valid date"),
});

export type IncomeFormValues = z.infer<typeof incomeFormSchema>;
export type ExpenseFormValues = z.infer<typeof expenseFormSchema>;
