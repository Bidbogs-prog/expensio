// src/app/expenses/page.tsx
"use client";

import { ExpenseForm } from "@/components/ExpenseForm";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useExpenseStore } from "@/useExpenseStore";

export default function ExpensesPage() {
  const { 
    expenses, 
    currency, 
    ExpenseTotal, 
    setCurrency, 
    removeExpense,
    isLoading,
    error 
  } = useExpenseStore();

  const currencies = ["USD", "MAD", "EUR"] as const;

  if (error) {
    return (
      <div className="w-full max-w-4xl mx-auto p-6">
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-red-600">Error: {error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full relative max-w-4xl mx-auto p-6">
      <div className="flex justify-end mb-6">
        <Select onValueChange={setCurrency} value={currency}>
          <SelectTrigger className="w-[80px] absolute top-2 right-2">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {currencies.map((cur) => (
              <SelectItem key={cur} value={cur}>
                {cur}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <ExpenseForm />

      <div className="mt-10">
        {isLoading && (
          <div className="flex justify-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900"></div>
          </div>
        )}
        
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[25%]">Category</TableHead>
              <TableHead className="w-[35%]">Item</TableHead>
              <TableHead className="w-[25%] text-right">Amount</TableHead>
              <TableHead className="w-[15%]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {expenses.map((expense) => (
              <TableRow key={expense.id}>
                <TableCell className="font-medium">
                  {expense.category.charAt(0).toUpperCase() +
                    expense.category.slice(1)}
                </TableCell>
                <TableCell>
                  {expense.name.charAt(0).toUpperCase() + expense.name.slice(1)}
                </TableCell>
                <TableCell className="text-right">
                  {expense.amount} {currency}
                </TableCell>
                <TableCell>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => expense.id && removeExpense(expense.id)}
                    className="h-8 w-8 rounded-full p-0"
                    disabled={isLoading}
                  >
                    ×
                  </Button>
                </TableCell>
              </TableRow>
            ))}

            {/* Total row */}
            <TableRow>
              <TableCell colSpan={2} className="font-semibold">
                Total
              </TableCell>
              <TableCell className="text-right font-semibold">
                {ExpenseTotal} {currency}
              </TableCell>
              <TableCell />
            </TableRow>
          </TableBody>
        </Table>
      </div>
    </div>
  );
}