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

const IOChart = () => {
  const { currentIncome, currency, IncomeTotal } = useExpenseStore();
  const [chartData, setChartData] = React.useState<ChartDataItem[]>([]);

  React.useEffect(() => {
    if (currentIncome && currentIncome.length > 0) {
      // Create a map to store totals per category
      const categoryTotals = new Map<string, number>();

      // Sum up amounts for each category
      currentIncome.forEach((inc) => {
        const amount =
          typeof inc.amount === "string" ? parseFloat(inc.amount) : inc.amount;
        const currentTotal = categoryTotals.get(inc.category) || 0;
        categoryTotals.set(inc.category, currentTotal + amount);
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
  }, [currentIncome]);

  return (
    <Card className="flex flex-col w-[30%]">
      <CardHeader className="items-center pb-0">
        <CardTitle>Expenses per category</CardTitle>
        <CardDescription>
          Total: {currency} {IncomeTotal.toLocaleString()}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-1 pb-0">
        <div className="h-[250px] w-full relative">
          <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
            <div className="text-center">
              <div className="text-2xl font-bold">{currency}</div>
              <div className="text-sm text-muted-foreground">
                {IncomeTotal.toLocaleString()}
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

export default IOChart;
