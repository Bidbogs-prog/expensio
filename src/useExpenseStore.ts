// src/useExpenseStore.ts
import { create } from "zustand";
import { expensesApi, incomeApi, userSettingsApi } from "./lib/api";
import { type Expense, type Income } from "./lib/supabase";
import { type ExpenseFormValues, type IncomeFormValues } from "./form-schemas";

interface ExpenseStore {
  // State
  currentIncome: Income[];
  expenses: Expense[];
  currency: string;
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
  setCurrency: (currency: string) => Promise<void>;
  
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

  // Remove expense
  removeExpense: async (id) => {
    try {
      set({ isLoading: true, error: null });
      
      await withTimeout(expensesApi.delete(id));

      set((state) => ({
        expenses: state.expenses.filter(expense => expense.id !== id),
      }));

      get().calculateTotals();
    } catch (error) {
      console.error('Error removing expense:', error);
      set({ error: error instanceof Error ? error.message : 'Failed to remove expense' });
    } finally {
      set({ isLoading: false });
    }
  },

  // Remove income
  removeIncome: async (id) => {
    try {
      set({ isLoading: true, error: null });
      
      await withTimeout(incomeApi.delete(id));

      set((state) => ({
        currentIncome: state.currentIncome.filter(income => income.id !== id),
      }));

      get().calculateTotals();
    } catch (error) {
      console.error('Error removing income:', error);
      set({ error: error instanceof Error ? error.message : 'Failed to remove income' });
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