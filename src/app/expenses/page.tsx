"use client";

import { ExpenseForm } from "@/components/ExpenseForm";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useExpenseStore } from "@/useExpenseStore";

export default function Home() {
  const { currentIncome, expenses, currency, total, isBroke, setCurrency } =
    useExpenseStore();

  const currencies = ["USD", "MAD", "EUR"] as const;

  return (
    <div className="w-full relative ">
      <div className="absolute right-2 -top-10">
        <Select onValueChange={setCurrency} value={currency}>
          <SelectTrigger>
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
      <div className="Expenses w-[400px] pl-5">
        <ExpenseForm />
        <div className="table w-[100%] mt-10">
        <Table>
  <TableHeader>
    <TableRow>
      <TableHead className="w-[50px]">Category</TableHead>
      <TableHead>Item</TableHead>
      <TableHead className="text-right">Amount</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    <TableRow>
      <TableCell className="font-medium">{expenses.map((expense, index) => (
              <div key={index}>
                {expense.category.charAt(0).toUpperCase() +
                  expense.category.slice(1)}
              </div>
            ))}</TableCell>
      <TableCell>{expenses.map((expense, index) => (
              <div key={index}>
                {expense.name.charAt(0).toUpperCase() + expense.name.slice(1)}
              </div>
            ))}</TableCell>
      <TableCell className="text-right">{expenses.map((expense, index) => (
              <div key={index}>
                {expense.amount} {currency}
              </div>
            ))}</TableCell>
    </TableRow>
    <TableRow>
      <TableCell>Total</TableCell>
      <TableCell></TableCell>
      <TableCell className="text-right">{total} {currency}</TableCell>
    </TableRow>
  </TableBody>
</Table>

        </div>

        <div className="ml-10 mt-4 flex gap-3">
          {/* <div className="grid grid-cols-1 justify-items-start">
            
          </div>
          <div className="grid grid-cols-1 justify-items-start">
            
          </div>
          <div className="grid grid-cols-1 justify-items-start">
            
          </div> */}
        </div>

        {/* <div className="ml-10 mt-4">
          Total: 
        </div> */}
      </div>
    </div>
  );
}
