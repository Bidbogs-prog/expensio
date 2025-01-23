"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import React, { useState } from "react";

type Income = {
  income: string;
};

type Expense = {
  expense: string;
};

export default function Home() {
  const [income, setIncome] = useState("");
  const [expense, setExpense] = useState("");

  const handleSubmit = function (e: React.FormEvent) {
    e.preventDefault();
  };

  return (
    <div className="w-[100%] grid grid-cols-2 divide-x-2 gap-5 relative h-screen divide-black">
      {" "}
      <div className="Income w-[300px] ml-[20px]">
        Income
        <form className="flex flex-col gap-3">
          <Input
            onChange={(e) => {
              setIncome(e.target.value);
            }}
          />
          <Button> Add your Income</Button>
        </form>
      </div>
      <div className="Expenses w-[300px] pl-[20px]">
        Expense
        <form className="flex flex-col gap-3">
          <Input
            onChange={(e) => {
              setExpense(e.target.value);
            }}
          />
          <Button type="submit"> Add your Expenses here</Button>
        </form>
      </div>
    </div>
  );
}
