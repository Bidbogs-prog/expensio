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

export default function Home() {
  const { currentIncome, currency, total, isBroke, setCurrency } =
    useExpenseStore();
  const currencies = ["USD", "MAD", "EUR"] as const;

  return (
    <div className="w-full relative">
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
      <div className="Income w-full ml-5">
        <IncomeForm />
        <div className="mt-4 flex flex-col gap-3">
          <div>
            {currentIncome} {currency}
          </div>
         
          
        </div>
      </div>
    </div>
  );
}
