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
  const { currentIncome, currency, IncomeTotal, setCurrency, removeIncome } =
    useExpenseStore();
  
  const currencies = ["USD", "MAD", "EUR"] as const;

  return (
    <div className="w-full max-w-4xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold">Income Management</h1>
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

      <div className="space-y-6">
        <IncomeForm />

        <div className="mt-10">
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
            {(currentIncome || []).map((currentIncome, index) => (
              <TableRow key={index}>
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
                    onClick={() => removeIncome(index)}
                    className="h-8 w-8 rounded-full p-0"
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
    </div>
  );
}
