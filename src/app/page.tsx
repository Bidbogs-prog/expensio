"use client";

import { useExpenseStore } from "@/useExpenseStore";
import {
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
      <div className="w-full relative min-h-screen bg-gradient-to-br from-background via-primary/5 to-accent/20">
        {/* Header with Currency Selector */}
        <div className="flex justify-between items-center gap-3 p-4 sm:p-6 pb-2">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              Dashboard
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Overview of your financial status
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

        {/* Stats Cards */}
        <div className="dashboard grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 p-4 sm:p-6">
          {/* Balance Card */}
          <Card
            className={cn(
              "hover-lift shadow-soft transition-smooth overflow-hidden relative",
              isBroke
                ? "bg-gradient-to-br from-red-50 to-red-100/50 border-red-200"
                : "bg-gradient-to-br from-green-50 to-emerald-100/50 border-green-200"
            )}
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-white/50 to-transparent rounded-bl-full"></div>
            <CardHeader className="relative">
              <div className="flex items-center justify-between">
                <CardTitle
                  className={cn(
                    "text-lg font-semibold",
                    isBroke ? "text-red-700" : "text-green-700"
                  )}
                >
                  Balance
                </CardTitle>
                <div
                  className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center",
                    isBroke ? "bg-red-200" : "bg-green-200"
                  )}
                >
                  <svg
                    className={cn(
                      "w-5 h-5",
                      isBroke ? "text-red-600" : "text-green-600"
                    )}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
              </div>
            </CardHeader>
            <CardContent className="flex flex-col gap-3 relative">
              <span
                className={cn(
                  "text-2xl sm:text-4xl font-bold",
                  isBroke ? "text-red-600" : "text-green-600"
                )}
              >
                {balance.toLocaleString()} {currency}
              </span>
              {isBroke && (
                <span className="text-xs font-medium text-red-600 bg-red-200/50 px-3 py-1.5 rounded-full inline-flex items-center gap-1 w-fit">
                  <svg
                    className="w-3.5 h-3.5"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Negative Balance
                </span>
              )}
            </CardContent>
          </Card>

          {/* Income Card */}
          <Card className="hover-lift shadow-soft transition-smooth overflow-hidden relative bg-gradient-to-br from-blue-50 to-cyan-100/50 border-blue-200">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-white/50 to-transparent rounded-bl-full"></div>
            <CardHeader className="relative">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-semibold text-blue-700">
                  Income
                </CardTitle>
                <div className="w-10 h-10 rounded-full bg-blue-200 flex items-center justify-center">
                  <svg
                    className="w-5 h-5 text-blue-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M7 11l5-5m0 0l5 5m-5-5v12"
                    />
                  </svg>
                </div>
              </div>
            </CardHeader>
            <CardContent className="relative">
              <span className="text-2xl sm:text-4xl font-bold text-blue-600">
                {IncomeTotal.toLocaleString()} {currency}
              </span>
            </CardContent>
          </Card>

          {/* Expenses Card */}
          <Card className="hover-lift shadow-soft transition-smooth overflow-hidden relative bg-gradient-to-br from-purple-50 to-violet-100/50 border-purple-200">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-white/50 to-transparent rounded-bl-full"></div>
            <CardHeader className="relative">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-semibold text-purple-700">
                  Expenses
                </CardTitle>
                <div className="w-10 h-10 rounded-full bg-purple-200 flex items-center justify-center">
                  <svg
                    className="w-5 h-5 text-purple-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 13l-5 5m0 0l-5-5m5 5V6"
                    />
                  </svg>
                </div>
              </div>
            </CardHeader>
            <CardContent className="relative">
              <span className="text-2xl sm:text-4xl font-bold text-purple-600">
                {ExpenseTotal.toLocaleString()} {currency}
              </span>
            </CardContent>
          </Card>
        </div>

        {/* Charts Section */}
        <div className="px-4 sm:px-6 pb-6">
          <h2 className="text-xl font-semibold mb-4 text-foreground">
            Financial Breakdown
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
            <OChart />
            <IOChart />
          </div>
        </div>
      </div>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
