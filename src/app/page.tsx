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

export default function Home() {
  const { currentIncome, expenses, currency, total, isBroke, setCurrency } =
    useExpenseStore();
  const queryClient = new QueryClient();

  console.log(isBroke)

  const currencies = ["USD", "MAD", "EUR"] as const;

  return (
    <QueryClientProvider client={queryClient}>
      <div className="w-full relative ">
        <div className="dashboard flex">
        <Card className="w-[300px] flex flex-col items-center ml-5">
        <CardHeader>
        <CardTitle>Balance</CardTitle>
        </CardHeader>
        <CardContent>
        {Number(currentIncome) - total} {currency}
  </CardContent>
  {isBroke && (
            <div className="text-red-600">BOI, you 'bout to be broke</div>
          )}
        </Card>
        <Card className="w-[300px] flex flex-col items-center ml-5">
        <CardHeader>
        <CardTitle>Income</CardTitle>
        </CardHeader>
        <CardContent>
        {currentIncome} {currency}
  </CardContent>
        </Card>
        <Card className="w-[300px] flex flex-col items-center ml-5">
        <CardHeader>
        <CardTitle>Expenses</CardTitle>
        </CardHeader>
        <CardContent>
        {total} {currency}
  </CardContent>
        </Card>
        </div>
       
        <div className="absolute right-2 -top-5">
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
      </div>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
