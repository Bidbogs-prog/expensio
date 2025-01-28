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
      <div className="absolute right-0 top-0">
        <Select onValueChange={setCurrency} defaultValue={currency}>
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
          <div>
            Current income after expense is: {Number(currentIncome) - total}{" "}
            {currency}
          </div>
          {isBroke && (
            <div className="text-red-600">BOI, you 'bout to be broke</div>
          )}
        </div>
      </div>
    </div>
  );
}
