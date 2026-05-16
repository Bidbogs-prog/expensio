"use client";

import { PieChart, Pie, ResponsiveContainer, Cell, Legend, Tooltip } from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useExpenseStore } from "@/useExpenseStore";

const EXPENSE_COLORS = {
  food: "#8b5cf6",
  transport: "#ec4899",
  entertainment: "#f59e0b",
  utilities: "#3b82f6",
  shopping: "#ef4444",
  health: "#10b981",
  other: "#6366f1",
};

const getColorForCategory = (category: string): string => {
  const lowerCategory = category.toLowerCase();
  return EXPENSE_COLORS[lowerCategory as keyof typeof EXPENSE_COLORS] || "#a855f7";
};

const CustomTooltip = ({ active, payload, currency }: any) => {
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

const OChart = () => {
  const { currency, getFilteredExpenses, ExpenseTotal, currentMonth } = useExpenseStore();

  const filteredExpenses = getFilteredExpenses();

  const categoryTotals = new Map<string, number>();
  filteredExpenses.forEach((exp) => {
    const amount = typeof exp.amount === "string" ? parseFloat(exp.amount) : exp.amount;
    categoryTotals.set(exp.category, (categoryTotals.get(exp.category) || 0) + amount);
  });

  const filteredTotal = Array.from(categoryTotals.values()).reduce((sum, v) => sum + v, 0);
  const chartData = Array.from(categoryTotals)
    .map(([category, amount]) => ({
      category: category.charAt(0).toUpperCase() + category.slice(1),
      amount,
      fill: getColorForCategory(category),
      percentage: filteredTotal > 0 ? (amount / filteredTotal) * 100 : 0,
    }))
    .sort((a, b) => b.amount - a.amount);

  const monthLabel = new Date(currentMonth + "-02").toLocaleDateString(undefined, {
    month: "long",
    year: "numeric",
  });

  return (
    <Card className="flex flex-col shadow-soft hover-lift transition-smooth">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-violet-600 flex items-center justify-center shadow-soft">
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 13l-5 5m0 0l-5-5m5 5V6" />
            </svg>
          </div>
          <div>
            <CardTitle className="text-lg">Expenses Breakdown</CardTitle>
            <CardDescription className="text-sm">
              {monthLabel} • Total: {currency} {ExpenseTotal.toLocaleString()}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-1 pb-6">
        {chartData.length === 0 ? (
          <div className="h-[300px] flex items-center justify-center">
            <div className="text-center">
              <div className="mx-auto w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mb-3">
                <svg className="w-8 h-8 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <p className="text-sm font-medium text-muted-foreground">No expenses in {monthLabel}</p>
              <p className="text-xs text-muted-foreground mt-1">Add expenses to see the breakdown</p>
            </div>
          </div>
        ) : (
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="99%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  dataKey="amount"
                  nameKey="category"
                  cx="50%"
                  cy="50%"
                  innerRadius="40%"
                  outerRadius="60%"
                  paddingAngle={2}
                  strokeWidth={2}
                  stroke="#fff"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip currency={currency} />} />
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

export default OChart;
