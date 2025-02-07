import { create } from "zustand";
import { persist } from "zustand/middleware";
import { type ExpenseFormValues, type IncomeFormValues } from "./form-schemas";

interface Expense {
  category: string;
  name: string;
  amount: string;
}

interface CurrentIncome {
  category: string;
  name: string;
  amount: string;
}

interface ExpenseStore {
  currentIncome: CurrentIncome[];
  expenses: Expense[];
  currency: string;
  ExpenseTotal: number;
  IncomeTotal: number;
  isBroke: boolean;

  addIncome: (values: IncomeFormValues) => void;
  editExpense: (indexToEdit: number, values: ExpenseFormValues) => void;
  addExpense: (values: ExpenseFormValues) => void;
  setCurrency: (currency: string) => void;
  calculateExpenseTotal: () => void;
  calculateIncomeTotal: () => void;
  checkIfBroke: () => void;
  removeExpense: (indexToRemove: number) => void;
  removeIncome: (indexToRemove: number) => void;
}

export const useExpenseStore = create<ExpenseStore>()(
  persist(
    (set, get) => ({
      currentIncome: [],
      expenses: [],
      currency: "MAD",
      ExpenseTotal: 0,
      IncomeTotal: 0,
      isBroke: false,

      addIncome: (values) => {
        set((state) => {
          const newIncome = [...state.currentIncome, values];
          const currentExpenseTotal = state.ExpenseTotal;
          const balance =
            newIncome.reduce((sum, income) => sum + Number(income.amount), 0) -
            currentExpenseTotal;
          console.log("Setting income:", {
            newIncome,
            currentExpenseTotal,
            balance,
            isBroke: balance < 0,
          });

          return {
            currentIncome: newIncome,
            IncomeTotal: newIncome.reduce(
              (sum, income) => sum + Number(income.amount),
              0
            ),
            isBroke: balance < 0,
          };
        });
      },

      addExpense: (values) => {
        set((state) => {
          const newExpenses = [...state.expenses, values];
          const newExpenseTotal = newExpenses.reduce(
            (sum, expense) => sum + Number(expense.amount),
            0
          );
          const balance =
            state.currentIncome.reduce(
              (sum, income) => sum + Number(income.amount),
              0
            ) - newExpenseTotal;

          console.log("Adding expense:", {
            newExpenseTotal,
            currentIncome: state.currentIncome,
            balance,
            isBroke: balance < 0,
          });

          return {
            expenses: newExpenses,
            ExpenseTotal: newExpenseTotal,
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
          const balance =
            state.currentIncome.reduce(
              (sum, income) => sum + Number(income.amount),
              0
            ) - newTotal;

          console.log("Removing expense:", {
            newTotal,
            currentIncome: state.currentIncome,
            balance,
            isBroke: balance < 0,
          });

          return {
            expenses: newExpenses,
            ExpenseTotal: newTotal,
            isBroke: balance < 0,
          };
        });
      },

      removeIncome: (indexToRemove: number) => {
        set((state) => {
          const newIncome = state.currentIncome.filter(
            (_, index) => index !== indexToRemove
          );
          const newTotal = newIncome.reduce(
            (sum, income) => sum + Number(income.amount),
            0
          );
          const balance =
            state.currentIncome.reduce(
              (sum, income) => sum + Number(income.amount),
              0
            ) - newTotal;

          console.log("Removing Income:", {
            newTotal,
            currentIncome: state.currentIncome,
            balance,
            isBroke: balance < 0,
          });

          return {
            currentIncome: newIncome,
            IncomeTotal: newTotal,
            isBroke: balance < 0,
          };
        });
      },

      editExpense: (indexToEdit: number, values: ExpenseFormValues) => {
        set((state) => {
          const newExpenses = state.expenses.map((exp, index) =>
            index === indexToEdit ? values : exp
          );
          const newExpensesTotal = newExpenses.reduce(
            (sum, expense) => sum + Number(expense.amount),
            0
          );
          const balance =
            state.currentIncome.reduce(
              (sum, income) => sum + Number(income.amount),
              0
            ) - newExpensesTotal;

          console.log("Editing expense:", {
            newExpensesTotal,
            currentIncome: state.currentIncome,
            balance,
            isBroke: balance < 0,
          });

          return {
            expenses: newExpenses,
            ExpenseTotal: newExpensesTotal,
            isBroke: balance < 0,
          };
        });
      },

      setCurrency: (currency) => {
        set({ currency });
      },

      calculateExpenseTotal: () => {
        const newTotal = get().expenses.reduce(
          (sum, expense) => sum + Number(expense.amount),
          0
        );
        set((state) => {
          const balance =
            state.currentIncome.reduce(
              (sum, income) => sum + Number(income.amount),
              0
            ) - newTotal;
          console.log("Calculating total:", {
            newTotal,
            currentIncome: state.currentIncome,
            balance,
            isBroke: balance < 0,
          });

          return {
            ExpenseTotal: newTotal,
            isBroke: balance < 0,
          };
        });
      },

      calculateIncomeTotal: () => {
        const newTotal = get().currentIncome.reduce(
          (sum, currentIncome) => sum + Number(currentIncome.amount),
          0
        );
        set((state) => {
          const balance =
            state.currentIncome.reduce(
              (sum, income) => sum + Number(income.amount),
              0
            ) - newTotal;
          console.log("Calculating total:", {
            newTotal,
            currentIncome: state.currentIncome,
            balance,
            isBroke: balance < 0,
          });

          return {
            IncomeTotal: newTotal,
            isBroke: balance < 0,
          };
        });
      },

      checkIfBroke: () => {
        const { IncomeTotal, ExpenseTotal } = get();
        const balance = Number(IncomeTotal) - ExpenseTotal;
        const isNowBroke = balance < 0;

        console.log("Checking if broke:", {
          IncomeTotal,
          ExpenseTotal,
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
        ExpenseTotal: state.ExpenseTotal,
        IncomeTotal: state.IncomeTotal,
        isBroke: state.isBroke,
      }),
    }
  )
);
