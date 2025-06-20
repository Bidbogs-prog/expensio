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

  // Initialize data from Supabase
  initializeData: async () => {
    try {
      set({ isLoading: true, error: null });
      
      // Load data in parallel
      const [expenses, income, settings] = await Promise.all([
        expensesApi.getAll(),
        incomeApi.getAll(),
        userSettingsApi.get()
      ]);

      set({
        expenses,
        currentIncome: income,
        currency: settings?.currency || "MAD",
      });

      get().calculateTotals();
    } catch (error) {
      console.error('Error initializing data:', error);
      set({ error: error instanceof Error ? error.message : 'An error occurred' });
    } finally {
      set({ isLoading: false });
    }
  },

  clearData: async () => {
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
      
      const newIncome = await incomeApi.create({
        category: values.category,
        name: values.name,
        amount: Number(values.amount)
      });

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
      
      const newExpense = await expensesApi.create({
        category: values.category,
        name: values.name,
        amount: Number(values.amount)
      });

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
      
      await expensesApi.delete(id);

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
      
      await incomeApi.delete(id);

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
      
      const updatedExpense = await expensesApi.update(id, {
        category: values.category,
        name: values.name,
        amount: Number(values.amount)
      });

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
    
    console.log('Setting currency to:', currency)
    
    const result = await userSettingsApi.upsert({ currency });
    console.log('Currency update result:', result)
    
    set({ currency });
  } catch (error) {
    console.error('Error setting currency - Full error:', error);
    console.error('Error type:', typeof error);
    console.error('Error keys:', Object.keys(error || {}));
    
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