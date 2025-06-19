"use client";

import { IncomeForm } from "@/components/IncomeForm";
import { useExpenseStore } from "@/useExpenseStore";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";

export default function Home() {
  const { currentIncome, currency, IncomeTotal, setCurrency, removeIncome, isLoading } =
    useExpenseStore();
  
  const currencies = ["USD", "MAD", "EUR"] as const;

  return (
    <div className="w-full max-w-4xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <Select onValueChange={setCurrency} value={currency}>
          <SelectTrigger className="w-[80px]">
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

      <IncomeForm />
      
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
            {currentIncome.map((currentIncome) => (
              <TableRow key={currentIncome.id}>
                <TableCell className="font-medium">
                  {currentIncome.category.charAt(0).toUpperCase() +
                    currentIncome.category.slice(1)}
                </TableCell>
                <TableCell>
                  {currentIncome.name.charAt(0).toUpperCase() + currentIncome.name.slice(1)}
                </TableCell>
                <TableCell className="text-right">
                  {currentIncome.amount} {currency}
                </TableCell>
                <TableCell>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => currentIncome.id && removeIncome(currentIncome.id)}
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
                {IncomeTotal} {currency}
              </TableCell>
              <TableCell />
            </TableRow>
          </TableBody>
        </Table>
      </div>
    </div>
  );
}