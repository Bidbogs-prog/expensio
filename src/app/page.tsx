"use client";

import { useExpenseStore } from "@/useExpenseStore";
import {
  useQuery,
  useMutation,
  useQueryClient,
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import OChart from "@/components/ui/expensesPieChart";
import IOChart from "@/components/ui/incomePieChart";

export default function Home() {
  const { currency, ExpenseTotal, IncomeTotal, isBroke, setCurrency } =
    useExpenseStore();
  const queryClient = new QueryClient();
  const currencies = ["USD", "MAD", "EUR"] as const;

  const balance = IncomeTotal - ExpenseTotal;

  return (
    <QueryClientProvider client={queryClient}>
      <div className="w-full relative">
        <div className="dashboard flex gap-5 p-5">
          <Card
            className={cn(
              "w-[300px] transition-colors duration-200",
              isBroke && "bg-red-50 border-red-200"
            )}
          >
            <CardHeader>
              <CardTitle
                className={cn("text-center", isBroke && "text-red-600")}
              >
                Balance
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center gap-2">
              <span
                className={cn(
                  "text-2xl font-bold",
                  isBroke ? "text-red-600" : "text-green-600"
                )}
              >
                {balance} {currency}
              </span>
              {isBroke && (
                <span className="text-sm text-red-500 bg-red-100 px-3 py-1 rounded-full">
                  Warning: Negative Balance
                </span>
              )}
            </CardContent>
          </Card>

          <Card className="w-[300px]">
            <CardHeader>
              <CardTitle className="text-center">Income</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <span className="text-2xl font-bold text-green-600">
                {IncomeTotal} {currency}
              </span>
            </CardContent>
          </Card>

          <Card className="w-[300px]">
            <CardHeader>
              <CardTitle className="text-center">Expenses</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <span className="text-2xl font-bold text-gray-600">
                {ExpenseTotal} {currency}
              </span>
            </CardContent>
          </Card>
        </div>

        <div className="absolute right-5 top-5">
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
        <div className="charts flex gap-5 justify-start ml-5">
          <OChart />
          <IOChart />
        </div>
      </div>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
