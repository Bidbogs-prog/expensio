import { create } from "zustand";
import { persist } from 'zustand/middleware'
import { type ExpenseFormValues, type IncomeFormValues } from "./form-schemas";

interface Expense {
  category: string;
  name: string;
  amount: string; // Changed back to string to match form values
}

interface ExpenseStore {
  // State
  currentIncome: string; // Changed back to string
  expenses: Expense[];
  currency: string;
  total: number;
  isBroke: boolean;

  // Actions
  setIncome: (values: IncomeFormValues) => void;
  addExpense: (values: ExpenseFormValues) => void;
  setCurrency: (currency: string) => void;
  calculateTotal: () => void;
  checkIfBroke: () => void;
}

export const useExpenseStore = create<ExpenseStore>()(
  persist(
    (set, get) => ({
      // Initial state
      currentIncome: "0",
      expenses: [],
      currency: "MAD",
      total: 0,
      isBroke: false,

      // Actions
      setIncome: (values) => {
        set({ currentIncome: values.income });
        get().checkIfBroke();
      },

      addExpense: (values) => {
        set((state) => ({
          expenses: [...state.expenses, values]
        }));
        get().calculateTotal();
        get().checkIfBroke();
      },
      // removeExpense: (values) => {
      //   set((state) => ({
      //     expenses: [...state.expenses, values]
      //   }));
      //   get().calculateTotal();
      //   get().checkIfBroke();
      // },

      setCurrency: (currency) => {
        set({ currency });
      },

      calculateTotal: () => {
        const total = get().expenses.reduce((sum, expense) => 
          sum + Number(expense.amount), 0
        );
        set({ total });
      },

      checkIfBroke: () => {
        const { currentIncome, total } = get();
        set({ isBroke: Number(currentIncome) - total < 0 });
      }
    }),
    {
      name: 'expense-storage', // unique name for localStorage key
      partialize: (state) => ({
        // Only persist these fields
        currentIncome: state.currentIncome,
        expenses: state.expenses,
        currency: state.currency,
        total: state.total
      })
    }
  )
)