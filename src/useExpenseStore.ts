import { create } from "zustand";
import { persist } from "zustand/middleware";
import { type ExpenseFormValues, type IncomeFormValues } from "./form-schemas";

interface Expense {
  category: string;
  name: string;
  amount: string;
}

interface ExpenseStore {
  currentIncome: string;
  expenses: Expense[];
  currency: string;
  total: number;
  isBroke: boolean;

  setIncome: (values: IncomeFormValues) => void;
  addExpense: (values: ExpenseFormValues) => void;
  setCurrency: (currency: string) => void;
  calculateTotal: () => void;
  checkIfBroke: () => void;
  removeExpense: (indexToRemove: number) => void;
}

export const useExpenseStore = create<ExpenseStore>()(
  persist(
    (set, get) => ({
      currentIncome: "0",
      expenses: [],
      currency: "MAD",
      total: 0,
      isBroke: false,

      setIncome: (values) => {
        set((state) => {
          const newIncome = values.income;
          const currentTotal = state.total;
          const balance = Number(newIncome) - currentTotal;
          console.log("Setting income:", {
            newIncome,
            currentTotal,
            balance,
            isBroke: balance < 0,
          });

          return {
            currentIncome: newIncome,
            isBroke: balance < 0,
          };
        });
      },

      addExpense: (values) => {
        set((state) => {
          const newExpenses = [...state.expenses, values];
          const newTotal = newExpenses.reduce(
            (sum, expense) => sum + Number(expense.amount),
            0
          );
          const balance = Number(state.currentIncome) - newTotal;

          console.log("Adding expense:", {
            newTotal,
            currentIncome: state.currentIncome,
            balance,
            isBroke: balance < 0,
          });

          return {
            expenses: newExpenses,
            total: newTotal,
            isBroke: balance < 0,
          };
        });
      },

      removeExpense: (indexToRemove: number) => {
        set((state) => {
          const newExpenses = state.expenses.filter(
            (_, index) => index !== indexToRemove
          );
          const newTotal = newExpenses.reduce(
            (sum, expense) => sum + Number(expense.amount),
            0
          );
          const balance = Number(state.currentIncome) - newTotal;

          console.log("Removing expense:", {
            newTotal,
            currentIncome: state.currentIncome,
            balance,
            isBroke: balance < 0,
          });

          return {
            expenses: newExpenses,
            total: newTotal,
            isBroke: balance < 0,
          };
        });
      },

      setCurrency: (currency) => {
        set({ currency });
      },

      calculateTotal: () => {
        const newTotal = get().expenses.reduce(
          (sum, expense) => sum + Number(expense.amount),
          0
        );
        set((state) => {
          const balance = Number(state.currentIncome) - newTotal;
          console.log("Calculating total:", {
            newTotal,
            currentIncome: state.currentIncome,
            balance,
            isBroke: balance < 0,
          });

          return {
            total: newTotal,
            isBroke: balance < 0,
          };
        });
      },

      checkIfBroke: () => {
        const { currentIncome, total } = get();
        const balance = Number(currentIncome) - total;
        const isNowBroke = balance < 0;

        console.log("Checking if broke:", {
          currentIncome,
          total,
          balance,
          isNowBroke,
        });

        set({ isBroke: isNowBroke });
      },
    }),
    {
      name: "expense-storage",
      partialize: (state) => ({
        currentIncome: state.currentIncome,
        expenses: state.expenses,
        currency: state.currency,
        total: state.total,
        isBroke: state.isBroke,
      }),
    }
  )
);
