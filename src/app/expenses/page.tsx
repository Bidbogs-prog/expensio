// src/app/expenses/page.tsx
"use client";

import { ExpenseForm } from "@/components/ExpenseForm";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
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
      <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-accent/20 p-6">
        <div className="w-full max-w-4xl mx-auto">
          <Card className="bg-red-50 border-red-200 shadow-soft p-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-red-200 flex items-center justify-center">
                <svg className="w-5 h-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-red-600 font-medium">Error: {error}</p>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-accent/20">
      <div className="w-full max-w-5xl mx-auto p-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              Expenses
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Track and manage your expenses
            </p>
          </div>
          <Select onValueChange={setCurrency} value={currency}>
            <SelectTrigger className="w-[100px] shadow-soft">
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

        {/* Expense Form */}
        <Card className="mb-8 shadow-soft hover-lift p-6">
          <ExpenseForm />
        </Card>

        {/* Expenses Table */}
        <Card className="shadow-medium overflow-hidden">
          {isLoading && (
            <div className="flex justify-center py-8 bg-muted/20">
              <div className="flex items-center gap-3">
                <div className="animate-spin rounded-full h-6 w-6 border-2 border-primary/20 border-t-primary"></div>
                <span className="text-sm text-muted-foreground">Loading expenses...</span>
              </div>
            </div>
          )}

          {expenses.length === 0 && !isLoading ? (
            <div className="p-12 text-center">
              <div className="mx-auto w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold mb-1">No expenses yet</h3>
              <p className="text-sm text-muted-foreground">Add your first expense using the form above</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="w-[25%] font-semibold">Category</TableHead>
                    <TableHead className="w-[35%] font-semibold">Item</TableHead>
                    <TableHead className="w-[25%] text-right font-semibold">Amount</TableHead>
                    <TableHead className="w-[15%] text-center font-semibold">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {expenses.map((expense) => (
                    <TableRow key={expense.id} className="hover:bg-muted/30 transition-colors">
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-primary"></div>
                          {expense.category.charAt(0).toUpperCase() +
                            expense.category.slice(1)}
                        </div>
                      </TableCell>
                      <TableCell>
                        {expense.name.charAt(0).toUpperCase() + expense.name.slice(1)}
                      </TableCell>
                      <TableCell className="text-right font-semibold text-purple-600">
                        {expense.amount.toLocaleString()} {currency}
                      </TableCell>
                      <TableCell className="text-center">
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => expense.id && removeExpense(expense.id)}
                          className="h-8 w-8 rounded-full p-0 shadow-soft hover:shadow-medium transition-smooth"
                          disabled={isLoading}
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}

                  {/* Total row */}
                  {expenses.length > 0 && (
                    <TableRow className="bg-gradient-to-r from-purple-50 to-violet-100/50 border-t-2 border-purple-200">
                      <TableCell colSpan={2} className="font-bold text-lg">
                        Total Expenses
                      </TableCell>
                      <TableCell className="text-right font-bold text-lg text-purple-600">
                        {ExpenseTotal.toLocaleString()} {currency}
                      </TableCell>
                      <TableCell />
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}