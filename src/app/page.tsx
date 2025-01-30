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

export default function Home() {
  const { currentIncome, expenses, currency, total, isBroke, setCurrency } =
    useExpenseStore();
  const queryClient = new QueryClient();

  const currencies = ["USD", "MAD", "EUR"] as const;

  return (
    <QueryClientProvider client={queryClient}>
      <div className="w-full relative ">
        <div className="ml-20">dashboard WIP</div>
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
