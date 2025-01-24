"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import React, { useEffect, useState } from "react";

export default function Home() {
  const [income, setIncome] = useState("");
  const [currentIncome, setCurrentIncome] = useState("");
  const [expenses, setExpenses] = useState<string[]>([]);
  const [currentExpense, setCurrentExpense] = useState("");
  const [amounts, setAmounts] = useState<string[]>([]);
  const [currentAmount, setCurrentAmount] = useState("");
  const [total, setTotal] = useState(0);

  let totalExpenses;
  useEffect(() => {
    totalExpenses = amounts.reduce((sum, num) => sum + Number(num), 0);
    setTotal(totalExpenses);
  }, [amounts]);

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
      setCurrentExpense("");
      setAmounts([...amounts, currentAmount]);

      setCurrentAmount("");
    }
  };

  return (
    <div className="w-[100%] grid grid-cols-2 divide-x-2 gap-5 relative h-screen divide-black">
      {" "}
      <div className="Income w-[300px] ml-[20px]">
        <form
          className="flex flex-col gap-3 mt-[20px]"
          onSubmit={handleSubmitIncome}
        >
          <span>Income</span>
          <Input
            value={income}
            onChange={(e) => {
              setIncome(e.target.value);
            }}
          />
          <Button> Add your Income</Button>
        </form>
        <div className="mt-4 flex flex-col gap-3">
          {currentIncome}
          <span>
            Current income after expense is: {Number(currentIncome) - total}
          </span>
        </div>
      </div>
      <div className="Expenses w-[400px] pl-[20px]">
        <form
          className="flex flex-col gap-3 mt-[20px]"
          onSubmit={handleSubmitExpense}
        >
          <div className="flex justify-evenly">
            <div>
              {" "}
              <span>Expense name</span>
              <Input
                value={currentExpense}
                onChange={(e) => setCurrentExpense(e.target.value)}
              />
            </div>
            <div>
              {" "}
              <span>Amount</span>
              <Input
                className="w-[60px]"
                value={currentAmount}
                onChange={(e) => setCurrentAmount(e.target.value)}
              />
            </div>
          </div>

          <Button className=" ml-10 w-[100px]" type="submit">
            Add Expense
          </Button>
        </form>

        <div className="ml-10 mt-4 flex gap-3">
          <div className="grid grid-cols-1 justify-items-start">
            {" "}
            {expenses.map((expense, index) => (
              <div key={index}>{`${expense}:`}</div>
            ))}
          </div>
          <div className="grid grid-cols-1  justify-items-start">
            {" "}
            {amounts.map((amount, index) => (
              <div key={index}>{amount}</div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
