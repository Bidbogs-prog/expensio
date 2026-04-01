// src/useExpenseStore.ts
import { create } from "zustand";
import { expensesApi, incomeApi, userSettingsApi } from "./lib/api";
import type { Expense, Income, Currency, ExpenseFormValues, IncomeFormValues } from "@/types";

interface ExpenseStore {
  // State
  currentIncome: Income[];
  expenses: Expense[];
  currency: Currency;
  isLoading: boolean;
  error: string | null;

  // Computed values
  ExpenseTotal: number;
  IncomeTotal: number;
  isBroke: boolean;

  // Actions
  initializeData: () => Promise<void>;
  clearData: () => Promise<void>;
  addIncome: (values: IncomeFormValues) => Promise<void>;
  addExpense: (values: ExpenseFormValues) => Promise<void>;
  removeExpense: (id: number) => Promise<void>;
  removeIncome: (id: number) => Promise<void>;
  editExpense: (id: number, values: ExpenseFormValues) => Promise<void>;
  editIncome: (id: number, values: IncomeFormValues) => Promise<void>;
  renameExpenseCategory: (oldName: string, newName: string) => Promise<void>;
  renameIncomeCategory: (oldName: string, newName: string) => Promise<void>;
  setCurrency: (currency: Currency) => Promise<void>;
  
  // Internal helpers
  calculateTotals: () => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

// Helper function to add timeout to API calls
const withTimeout = <T>(promise: Promise<T>, timeoutMs: number = 10000): Promise<T> => {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`Operation timed out after ${timeoutMs}ms`)), timeoutMs)
    )
  ]);
};

// Helper function to safely execute API calls with fallbacks
const safeApiCall = async <T>(
  apiCall: () => Promise<T>, 
  fallbackValue: T, 
  operationName: string
): Promise<T> => {
  try {
    console.log(`Starting ${operationName}...`);
    const result = await withTimeout(apiCall(), 8000);
    console.log(`${operationName} completed successfully`);
    return result;
  } catch (error) {
    console.error(`${operationName} failed:`, error);
    return fallbackValue;
  }
};

export const useExpenseStore = create<ExpenseStore>((set, get) => ({
  // Initial state
  currentIncome: [],
  expenses: [],
  currency: "MAD",
  isLoading: false,
  error: null,
  ExpenseTotal: 0,
  IncomeTotal: 0,
  isBroke: false,

  // Initialize data from Supabase with better error handling
  initializeData: async () => {
    try {
      console.log('Starting data initialization...');
      set({ isLoading: true, error: null });
      
      // Load data with individual error handling and timeouts
      const [expenses, income, settings] = await Promise.allSettled([
        safeApiCall(() => expensesApi.getAll(), [], 'Loading expenses'),
        safeApiCall(() => incomeApi.getAll(), [], 'Loading income'),
        safeApiCall(() => userSettingsApi.get(), null, 'Loading settings')
      ]);

      // Extract results, using fallback values for failed calls
      const expensesResult = expenses.status === 'fulfilled' ? expenses.value : [];
      const incomeResult = income.status === 'fulfilled' ? income.value : [];
      const settingsResult = settings.status === 'fulfilled' ? settings.value : null;

      // Log any failures for debugging
      if (expenses.status === 'rejected') {
        console.error('Failed to load expenses:', expenses.reason);
      }
      if (income.status === 'rejected') {
        console.error('Failed to load income:', income.reason);
      }
      if (settings.status === 'rejected') {
        console.error('Failed to load settings:', settings.reason);
      }

      console.log('Data loaded:', {
        expenses: expensesResult.length,
        income: incomeResult.length,
        currency: settingsResult?.currency || 'MAD'
      });

      set({
        expenses: expensesResult,
        currentIncome: incomeResult,
        currency: settingsResult?.currency || "MAD",
      });

      get().calculateTotals();
      console.log('Data initialization completed successfully');
      
    } catch (error) {
      console.error('Critical error during data initialization:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to initialize data';
      set({ error: errorMessage });
    } finally {
      set({ isLoading: false });
    }
  },

  clearData: async () => {
    console.log('Clearing all data...');
    set({
      currentIncome: [],
      expenses: [],
      currency: "MAD",
      isLoading: false,
      error: null,
      ExpenseTotal: 0,
      IncomeTotal: 0,
      isBroke: false,
    });
  },

  // Add income
  addIncome: async (values) => {
    try {
      set({ isLoading: true, error: null });
      
      const newIncome = await withTimeout(incomeApi.create({
        category: values.category,
        name: values.name,
        amount: Number(values.amount)
      }));

      set((state) => ({
        currentIncome: [newIncome, ...state.currentIncome],
      }));

      get().calculateTotals();
    } catch (error) {
      console.error('Error adding income:', error);
      set({ error: error instanceof Error ? error.message : 'Failed to add income' });
    } finally {
      set({ isLoading: false });
    }
  },

  // Add expense
  addExpense: async (values) => {


    
    try {
      set({ isLoading: true, error: null });
      
      const newExpense = await withTimeout(expensesApi.create({
        category: values.category,
        name: values.name,
        amount: Number(values.amount)
      }));

      set((state) => ({
        expenses: [newExpense, ...state.expenses],
      }));

      get().calculateTotals();
    } catch (error) {
      console.error('Error adding expense:', error);
      set({ error: error instanceof Error ? error.message : 'Failed to add expense' });
    } finally {
      set({ isLoading: false });
    }
  },

  removeExpense: async (id) => {
  // 1. Save current state for rollback
  const previousExpenses = get().expenses;

  // 2. Optimistically remove from UI immediately
  set((state) => ({
    expenses: state.expenses.filter(e => e.id !== id),
  }));
  get().calculateTotals();

  // 3. Try the API call
  try {
    await expensesApi.delete(id);
  } catch (error) {
    // 4. Rollback on failure
    set({ expenses: previousExpenses });
    get().calculateTotals();
    set({ error: 'Failed to delete expense. Changes reverted.' });
  }
},

  // Remove income
  removeIncome: async (id) => {

    const previousIncome = get().currentIncome;

    set((state) => ({
        currentIncome: state.currentIncome.filter(income => income.id !== id),
      }));
    
    get().calculateTotals();

    try {
      set({ isLoading: true, error: null });
      await withTimeout(incomeApi.delete(id));

    } catch (error) {
      set({ currentIncome: previousIncome });
      get().calculateTotals();
      set({ error: 'Failed to delete income. Changes reverted.' });
    } finally {
      set({ isLoading: false });
    }
  },

  // Edit expense
  editExpense: async (id, values) => {
    try {
      set({ isLoading: true, error: null });
      
      const updatedExpense = await withTimeout(expensesApi.update(id, {
        category: values.category,
        name: values.name,
        amount: Number(values.amount)
      }));

      set((state) => ({
        expenses: state.expenses.map(expense => 
          expense.id === id ? updatedExpense : expense
        ),
      }));

      get().calculateTotals();
    } catch (error) {
      console.error('Error editing expense:', error);
      set({ error: error instanceof Error ? error.message : 'Failed to edit expense' });
    } finally {
      set({ isLoading: false });
    }
  },

  // Edit income
  editIncome: async (id, values) => {
    try {
      set({ isLoading: true, error: null });

      const updatedIncome = await withTimeout(incomeApi.update(id, {
        category: values.category,
        name: values.name,
        amount: Number(values.amount)
      }));

      set((state) => ({
        currentIncome: state.currentIncome.map(income =>
          income.id === id ? updatedIncome : income
        ),
      }));

      get().calculateTotals();
    } catch (error) {
      console.error('Error editing income:', error);
      set({ error: error instanceof Error ? error.message : 'Failed to edit income' });
    } finally {
      set({ isLoading: false });
    }
  },

  // Rename expense category (batch update all expenses with that category)
  renameExpenseCategory: async (oldName, newName) => {
    try {
      set({ isLoading: true, error: null });
      const { expenses } = get();
      const toUpdate = expenses.filter((e) => e.category === oldName && e.id);

      await Promise.all(
        toUpdate.map((e) =>
          withTimeout(
            expensesApi.update(e.id!, {
              category: newName,
              name: e.name,
              amount: e.amount,
            })
          )
        )
      );

      set((state) => ({
        expenses: state.expenses.map((e) =>
          e.category === oldName ? { ...e, category: newName } : e
        ),
      }));
    } catch (error) {
      console.error("Error renaming expense category:", error);
      set({ error: error instanceof Error ? error.message : "Failed to rename category" });
    } finally {
      set({ isLoading: false });
    }
  },

  // Rename income category (batch update all income with that category)
  renameIncomeCategory: async (oldName, newName) => {
    try {
      set({ isLoading: true, error: null });
      const { currentIncome } = get();
      const toUpdate = currentIncome.filter((i) => i.category === oldName && i.id);

      await Promise.all(
        toUpdate.map((i) =>
          withTimeout(
            incomeApi.update(i.id!, {
              category: newName,
              name: i.name,
              amount: i.amount,
            })
          )
        )
      );

      set((state) => ({
        currentIncome: state.currentIncome.map((i) =>
          i.category === oldName ? { ...i, category: newName } : i
        ),
      }));
    } catch (error) {
      console.error("Error renaming income category:", error);
      set({ error: error instanceof Error ? error.message : "Failed to rename category" });
    } finally {
      set({ isLoading: false });
    }
  },

  // Set currency
  setCurrency: async (currency) => {
    try {
      set({ isLoading: true, error: null });
      
      console.log('Setting currency to:', currency);
      
      const result = await withTimeout(userSettingsApi.upsert({ currency }));
      console.log('Currency update result:', result);
      
      set({ currency });
    } catch (error) {
      console.error('Error setting currency - Full error:', error);
      
      const errorMessage = error instanceof Error 
        ? error.message 
        : typeof error === 'string' 
          ? error 
          : 'Failed to update currency - Unknown error';
          
      set({ error: errorMessage });
    } finally {
      set({ isLoading: false });
    }
  },

  // Calculate totals and broke status
  calculateTotals: () => {
    const { expenses, currentIncome } = get();
    
    const ExpenseTotal = expenses.reduce((sum, expense) => sum + Number(expense.amount), 0);
    const IncomeTotal = currentIncome.reduce((sum, income) => sum + Number(income.amount), 0);
    const isBroke = IncomeTotal < ExpenseTotal;

    set({ ExpenseTotal, IncomeTotal, isBroke });
  },

  // Helper methods
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
}));