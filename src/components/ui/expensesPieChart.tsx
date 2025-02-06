"use client";

import React from "react";
import { PieChart, Pie, ResponsiveContainer } from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useExpenseStore } from "@/useExpenseStore";

interface ChartDataItem {
  category: string;
  amount: number;
  fill: string;
}

const OChart = () => {
  const { expenses, currency, ExpenseTotal } = useExpenseStore();
  const [chartData, setChartData] = React.useState<ChartDataItem[]>([]);

  React.useEffect(() => {
    if (expenses && expenses.length > 0) {
      // Create a map to store totals per category
      const categoryTotals = new Map<string, number>();

      // Sum up amounts for each category
      expenses.forEach((exp) => {
        const amount =
          typeof exp.amount === "string" ? parseFloat(exp.amount) : exp.amount;
        const currentTotal = categoryTotals.get(exp.category) || 0;
        categoryTotals.set(exp.category, currentTotal + amount);
      });

      // Transform the data for the chart
      const transformedData: ChartDataItem[] = Array.from(categoryTotals).map(
        ([category, amount]) => ({
          category,
          amount,
          fill: `hsl(${Math.random() * 360}, 70%, 50%)`,
        })
      );

      setChartData(transformedData);
    }
  }, [expenses]);

  return (
    <Card className="flex flex-col w-[30%]">
      <CardHeader className="items-center pb-0">
        <CardTitle>Expenses per category</CardTitle>
        <CardDescription>
          Total: {currency} {ExpenseTotal.toLocaleString()}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-1 pb-0">
        <div className="h-[250px] w-full relative">
          <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
            <div className="text-center">
              <div className="text-2xl font-bold">{currency}</div>
              <div className="text-sm text-muted-foreground">
                {ExpenseTotal.toLocaleString()}
              </div>
            </div>
          </div>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                dataKey="amount"
                nameKey="category"
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                label={(entry) => entry.category}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

export default OChart;
