"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import React, { useEffect, useState } from "react";

export default function Home() {
  const [income, setIncome] = useState("");
  const [currentIncome, setCurrentIncome] = useState("0");
  const [expenses, setExpenses] = useState<string[]>([]);
  const [currentExpense, setCurrentExpense] = useState("");
  const [amounts, setAmounts] = useState<string[]>([]);
  const [currentAmount, setCurrentAmount] = useState("");
  const [total, setTotal] = useState(0);
  const [category, setCategory] = useState("");
  const [currency, setCurrency] = useState("MAD");
  const [currentCategory, setCurrentCategory] = useState<string[]>([]);
  const [isBroke, setIsBroke] = useState(false);

  const currencies = ["USD", "MAD", "EUR"];
  const categories = ["food", "transport", "bills", "entertainment"];

  let totalExpenses;

  useEffect(() => {
    totalExpenses = amounts.reduce((sum, num) => sum + Number(num), 0);
    setTotal(totalExpenses);
  }, [amounts]);

  useEffect(() => {
    if (Number(currentIncome) - total < 0) {
      setIsBroke(true);
    } else {
      setIsBroke(false);
    }
  }, [total, income, currentIncome]);

  const handleSubmitIncome = (e: React.FormEvent) => {
    e.preventDefault();
    if (income.trim() !== "") {
      setCurrentIncome(income);
      setIncome("");
    }
  };

  const handleSubmitExpense = (e: React.FormEvent) => {
    e.preventDefault();

    if (currentExpense.trim() !== "" && currentAmount.trim() !== "") {
      setExpenses([...expenses, currentExpense]);
      setCurrentCategory([...currentCategory, category]);
      setAmounts([...amounts, currentAmount]);

      setCurrentExpense("");
      setCurrentAmount("");
      setCategory("");
    }
  };

  return (
    <div className="w-[100%] grid grid-cols-2 divide-x-2 gap-5 relative h-screen divide-black">
      <div className="Income w-[100%] ml-[20px]">
        <form
          className="flex flex-col gap-3 mt-[20px]"
          onSubmit={handleSubmitIncome}
        >
          <span>Income</span>
          <Input
            type="number"
            className="w-[150px]"
            placeholder="Salary"
            value={income}
            onChange={(e) => {
              setIncome(e.currentTarget.value);
            }}
          />
          <Button className="w-[150px]"> Add your Income</Button>
        </form>
        <div className="mt-4 flex flex-col gap-3">
          {currentIncome} {currency}
          <span>
            Current income after expense is: {Number(currentIncome) - total}{" "}
            {currency}
          </span>
          {isBroke && (
            <div className="text-red-600"> BOI, you 'bout to be broke</div>
          )}
        </div>
      </div>
      <div className="Expenses w-[400px] pl-[20px]">
        <div className="absolute right-2 top-2">
          <Select onValueChange={setCurrency}>
            <SelectTrigger>
              <SelectValue placeholder="MAD" />
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
        <form
          className="flex flex-col gap-3 mt-[20px]"
          onSubmit={handleSubmitExpense}
        >
          <div className="flex justify-evenly gap-6">
            <div className="flex flex-col gap-3">
              <span>Category</span>
              <Select onValueChange={setCategory}>
                <SelectTrigger className="w-[130px]">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat.charAt(0).toUpperCase() + cat.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-3">
              {" "}
              <span>Expense name</span>
              <Input
                value={currentExpense}
                onChange={(e) => setCurrentExpense(e.currentTarget.value)}
              />
            </div>
            <div className="flex flex-col gap-3">
              {" "}
              <span>Amount</span>
              <Input
                type="number"
                className="w-[90px]"
                value={currentAmount}
                onChange={(e) => setCurrentAmount(e.currentTarget.value)}
              />
            </div>
          </div>

          <Button className="w-[100px]" type="submit">
            Add Expense
          </Button>
        </form>

        <div className="ml-10 mt-4 flex gap-3">
          <div className="grid grid-cols-1  justify-items-start">
            {" "}
            {currentCategory.map((category, index) => (
              <div key={index}>
                {category.charAt(0).toUpperCase() + category.slice(1)}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-1 justify-items-start">
            {" "}
            {expenses.map((expense, index) => (
              <div key={index}>{`${
                expense.charAt(0).toUpperCase() + expense.slice(1)
              }:`}</div>
            ))}
          </div>
          <div className="grid grid-cols-1  justify-items-start">
            {" "}
            {amounts.map((amount, index) => (
              <div key={index}>
                {amount} {currency}
              </div>
            ))}
          </div>
        </div>
        <div className="ml-10 mt-4">
          Total: {total} {currency}
        </div>
      </div>
    </div>
  );
}
