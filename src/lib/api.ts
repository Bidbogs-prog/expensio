// src/lib/api.ts
import { supabase, type Expense, type Income, type UserSettings } from './supabase'

// Auth helper to ensure we have a valid session
async function ensureAuthenticated() {
  // First check if we have a session
  const { data: { session }, error: sessionError } = await supabase.auth.getSession()
  
  if (sessionError) {
    console.error('Session error:', sessionError)
    throw new Error('Failed to verify authentication')
  }

  if (!session) {
    throw new Error('No active session - user needs to sign in')
  }

  // Double-check with getUser for additional validation
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  
  if (userError) {
    console.error('User validation error:', userError)
    throw new Error('Authentication validation failed')
  }

  if (!user) {
    throw new Error('User not authenticated')
  }

  return { user, session }
}

// Enhanced error handling wrapper
async function withAuth<T>(operation: (userId: string) => Promise<T>): Promise<T> {
  try {
    const { user } = await ensureAuthenticated()
    return await operation(user.id)
  } catch (error) {
    // If it's an auth error, we might want to trigger a re-authentication
    if (error instanceof Error && error.message.includes('authentication')) {
      // You could emit an event here to trigger sign-out in your AuthProvider
      console.error('Auth error in API call:', error.message)
    }
    throw error
  }
}

// Expenses API
export const expensesApi = {
  async getAll(): Promise<Expense[]> {
    return withAuth(async (userId) => {
      const { data, error } = await supabase
        .from('expenses')
        .select('*')
        .eq('user_id', userId) // Add this for security
        .order('created_at', { ascending: false })
      
      if (error) {
        console.error('Expenses fetch error:', error)
        throw new Error(`Failed to fetch expenses: ${error.message}`)
      }
      return data || []
    })
  },

  async create(expense: Omit<Expense, 'id' | 'created_at' | 'user_id'>): Promise<Expense> {
    return withAuth(async (userId) => {
      const { data, error } = await supabase
        .from('expenses')
        .insert([{ ...expense, user_id: userId }])
        .select()
        .single()
      
      if (error) {
        console.error('Expense creation error:', error)
        throw new Error(`Failed to create expense: ${error.message}`)
      }
      return data
    })
  },

  async update(id: number, expense: Omit<Expense, 'id' | 'created_at' | 'user_id'>): Promise<Expense> {
    return withAuth(async (userId) => {
      const { data, error } = await supabase
        .from('expenses')
        .update(expense)
        .eq('id', id)
        .eq('user_id', userId) // Security: ensure user owns this expense
        .select()
        .single()
      
      if (error) {
        console.error('Expense update error:', error)
        throw new Error(`Failed to update expense: ${error.message}`)
      }
      return data
    })
  },

  async delete(id: number): Promise<void> {
    return withAuth(async (userId) => {
      const { error } = await supabase
        .from('expenses')
        .delete()
        .eq('id', id)
        .eq('user_id', userId) // Security: ensure user owns this expense
      
      if (error) {
        console.error('Expense deletion error:', error)
        throw new Error(`Failed to delete expense: ${error.message}`)
      }
    })
  }
}

// Income API
export const incomeApi = {
  async getAll(): Promise<Income[]> {
    return withAuth(async (userId) => {
      const { data, error } = await supabase
        .from('income')
        .select('*')
        .eq('user_id', userId) // Add this for security
        .order('created_at', { ascending: false })
      
      if (error) {
        console.error('Income fetch error:', error)
        throw new Error(`Failed to fetch income: ${error.message}`)
      }
      return data || []
    })
  },

  async create(income: Omit<Income, 'id' | 'created_at' | 'user_id'>): Promise<Income> {
    return withAuth(async (userId) => {
      const { data, error } = await supabase
        .from('income')
        .insert([{ ...income, user_id: userId }])
        .select()
        .single()
      
      if (error) {
        console.error('Income creation error:', error)
        throw new Error(`Failed to create income: ${error.message}`)
      }
      return data
    })
  },

  async update(id: number, income: Omit<Income, 'id' | 'created_at' | 'user_id'>): Promise<Income> {
    return withAuth(async (userId) => {
      const { data, error } = await supabase
        .from('income')
        .update(income)
        .eq('id', id)
        .eq('user_id', userId) // Security: ensure user owns this income
        .select()
        .single()
      
      if (error) {
        console.error('Income update error:', error)
        throw new Error(`Failed to update income: ${error.message}`)
      }
      return data
    })
  },

  async delete(id: number): Promise<void> {
    return withAuth(async (userId) => {
      const { error } = await supabase
        .from('income')
        .delete()
        .eq('id', id)
        .eq('user_id', userId) // Security: ensure user owns this income
      
      if (error) {
        console.error('Income deletion error:', error)
        throw new Error(`Failed to delete income: ${error.message}`)
      }
    })
  }
}

// User Settings API
export const userSettingsApi = {
  async get(): Promise<UserSettings | null> {
    return withAuth(async (userId) => {
      const { data, error } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', userId)
        .single()
      
      if (error && error.code !== 'PGRST116') {
        console.error('Get user settings error:', error)
        throw new Error(`Failed to get settings: ${error.message}`)
      }
      return data
    })
  },

  async upsert(settings: Omit<UserSettings, 'id' | 'created_at' | 'updated_at' | 'user_id'>): Promise<UserSettings> {
    return withAuth(async (userId) => {
      // Try upsert first (more efficient)
      const { data, error } = await supabase
        .from('user_settings')
        .upsert({
          ...settings,
          user_id: userId,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id'
        })
        .select()
        .single()

      if (error) {
        console.error('Settings upsert error:', error)
        throw new Error(`Failed to save settings: ${error.message}`)
      }
      return data
    })
  }
}

// Utility function to check auth status without throwing
export async function checkAuthStatus(): Promise<{ isAuthenticated: boolean; user: any | null }> {
  try {
    const { user } = await ensureAuthenticated()
    return { isAuthenticated: true, user }
  } catch {
    return { isAuthenticated: false, user: null }
  }
}