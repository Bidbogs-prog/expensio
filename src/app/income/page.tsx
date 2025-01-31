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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function Home() {
  const { currentIncome, currency, total, isBroke, setCurrency } =
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

        <Card>
          <CardHeader>
            <CardTitle>Current Balance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">
                  Current Income:
                </span>
                <span className="text-lg font-medium">
                  {currentIncome} {currency}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">
                  Total Expenses:
                </span>
                <span className="text-lg font-medium">
                  {total} {currency}
                </span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t">
                <span className="text-sm font-medium">Remaining Balance:</span>
                <span
                  className={`text-lg font-bold ${
                    Number(currentIncome) - total < 0
                      ? "text-red-600"
                      : "text-green-600"
                  }`}
                >
                  {Number(currentIncome) - total} {currency}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {isBroke && (
          <div className="p-4 bg-red-100 border border-red-200 rounded-lg text-red-600">
            Warning: Your expenses are exceeding your income!
          </div>
        )}
      </div>
    </div>
  );
}
