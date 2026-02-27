"use client";

import { IncomeForm } from "@/components/IncomeForm";
import { useExpenseStore } from "@/useExpenseStore";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";

export default function IncomePage() {
  const { currentIncome, currency, IncomeTotal, setCurrency, removeIncome, isLoading } =
    useExpenseStore();

  const currencies = ["USD", "MAD", "EUR"] as const;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-accent/20">
      <div className="w-full max-w-5xl mx-auto p-4 sm:p-6">
        {/* Header */}
        <div className="flex justify-between items-center gap-3 mb-6 sm:mb-8">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              Income
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Track and manage your income sources
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

        {/* Income Form */}
        <Card className="mb-6 sm:mb-8 shadow-soft hover-lift p-4 sm:p-6">
          <IncomeForm />
        </Card>

        {/* Income Table */}
        <Card className="shadow-medium overflow-hidden">
          {isLoading && (
            <div className="flex justify-center py-8 bg-muted/20">
              <div className="flex items-center gap-3">
                <div className="animate-spin rounded-full h-6 w-6 border-2 border-primary/20 border-t-primary"></div>
                <span className="text-sm text-muted-foreground">Loading income...</span>
              </div>
            </div>
          )}

          {currentIncome.length === 0 && !isLoading ? (
            <div className="p-8 sm:p-12 text-center">
              <div className="mx-auto w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold mb-1">No income entries yet</h3>
              <p className="text-sm text-muted-foreground">Add your first income source using the form above</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="w-[25%] font-semibold">Category</TableHead>
                    <TableHead className="w-[35%] font-semibold">Source</TableHead>
                    <TableHead className="w-[25%] text-right font-semibold">Amount</TableHead>
                    <TableHead className="w-[15%] text-center font-semibold">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {currentIncome.map((income) => (
                    <TableRow key={income.id} className="hover:bg-muted/30 transition-colors">
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                          {income.category.charAt(0).toUpperCase() +
                            income.category.slice(1)}
                        </div>
                      </TableCell>
                      <TableCell>
                        {income.name.charAt(0).toUpperCase() + income.name.slice(1)}
                      </TableCell>
                      <TableCell className="text-right font-semibold text-blue-600">
                        {income.amount.toLocaleString()} {currency}
                      </TableCell>
                      <TableCell className="text-center">
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => income.id && removeIncome(income.id)}
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
                  {currentIncome.length > 0 && (
                    <TableRow className="bg-gradient-to-r from-blue-50 to-cyan-100/50 border-t-2 border-blue-200">
                      <TableCell colSpan={2} className="font-bold text-base sm:text-lg">
                        Total Income
                      </TableCell>
                      <TableCell className="text-right font-bold text-base sm:text-lg text-blue-600">
                        {IncomeTotal.toLocaleString()} {currency}
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