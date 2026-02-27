"use client";

import React from "react";
import { PieChart, Pie, ResponsiveContainer, Cell, Legend, Tooltip } from "recharts";
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
  percentage: number;
}

const INCOME_COLORS = {
  freelance: "#06b6d4", // cyan-500
  "9 to 5": "#3b82f6", // blue-500
  business: "#8b5cf6", // violet-500
  rent: "#10b981", // emerald-500
  salary: "#0ea5e9", // sky-500
  investment: "#6366f1", // indigo-500
  other: "#14b8a6", // teal-500
};

const getColorForCategory = (category: string): string => {
  const lowerCategory = category.toLowerCase();
  return INCOME_COLORS[lowerCategory as keyof typeof INCOME_COLORS] || "#06b6d4";
};

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
          category: category.charAt(0).toUpperCase() + category.slice(1),
          amount,
          fill: getColorForCategory(category),
          percentage: IncomeTotal > 0 ? (amount / IncomeTotal) * 100 : 0,
        })
      );

      setChartData(transformedData.sort((a, b) => b.amount - a.amount));
    } else {
      setChartData([]);
    }
  }, [currentIncome, IncomeTotal]);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-card border border-border rounded-lg shadow-medium p-3">
          <p className="font-semibold text-sm">{data.category}</p>
          <p className="text-sm text-muted-foreground">
            {currency} {data.amount.toLocaleString()}
          </p>
          <p className="text-xs text-muted-foreground">
            {data.percentage.toFixed(1)}% of total
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="flex flex-col shadow-soft hover-lift transition-smooth">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center shadow-soft">
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11l5-5m0 0l5 5m-5-5v12" />
            </svg>
          </div>
          <div>
            <CardTitle className="text-lg">Income Breakdown</CardTitle>
            <CardDescription className="text-sm">
              By category • Total: {currency} {IncomeTotal.toLocaleString()}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-1 pb-6">
        {chartData.length === 0 ? (
          <div className="h-[300px] flex items-center justify-center">
            <div className="text-center">
              <div className="mx-auto w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center mb-3">
                <svg className="w-8 h-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-sm font-medium text-muted-foreground">No income data</p>
              <p className="text-xs text-muted-foreground mt-1">Add income to see breakdown</p>
            </div>
          </div>
        ) : (
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  dataKey="amount"
                  nameKey="category"
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={100}
                  paddingAngle={2}
                  strokeWidth={2}
                  stroke="#fff"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  verticalAlign="bottom"
                  height={36}
                  iconType="circle"
                  formatter={(value, entry: any) => (
                    <span className="text-sm">
                      {value} ({entry.payload.percentage.toFixed(0)}%)
                    </span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default IOChart;
