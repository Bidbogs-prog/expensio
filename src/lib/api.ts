// src/lib/api.ts
import { supabase, type Expense, type Income, type UserSettings } from './supabase'

// Expenses API
export const expensesApi = {
  async getAll(): Promise<Expense[]> {
    const { data, error } = await supabase
      .from('expenses')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data || []
  },

  async create(expense: Omit<Expense, 'id' | 'created_at' | 'user_id'>): Promise<Expense> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    const { data, error } = await supabase
      .from('expenses')
      .insert([{ ...expense, user_id: user.id }])
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async update(id: number, expense: Omit<Expense, 'id' | 'created_at' | 'user_id'>): Promise<Expense> {
    const { data, error } = await supabase
      .from('expenses')
      .update(expense)
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async delete(id: number): Promise<void> {
    const { error } = await supabase
      .from('expenses')
      .delete()
      .eq('id', id)
    
    if (error) throw error
  }
}

// Income API
export const incomeApi = {
  async getAll(): Promise<Income[]> {
    const { data, error } = await supabase
      .from('income')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data || []
  },

  async create(income: Omit<Income, 'id' | 'created_at' | 'user_id'>): Promise<Income> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    const { data, error } = await supabase
      .from('income')
      .insert([{ ...income, user_id: user.id }])
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async update(id: number, income: Omit<Income, 'id' | 'created_at' | 'user_id'>): Promise<Income> {
    const { data, error } = await supabase
      .from('income')
      .update(income)
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async delete(id: number): Promise<void> {
    const { error } = await supabase
      .from('income')
      .delete()
      .eq('id', id)
    
    if (error) throw error
  }
}

// User Settings API
export const userSettingsApi = {
  async get(): Promise<UserSettings | null> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    const { data, error } = await supabase
      .from('user_settings')
      .select('*')
      .eq('user_id', user.id)
      .single()
    
    if (error && error.code !== 'PGRST116') {
      console.error('Get user settings error:', error)
      throw error
    }
    return data
  },

  async upsert(settings: Omit<UserSettings, 'id' | 'created_at' | 'updated_at' | 'user_id'>): Promise<UserSettings> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      throw new Error('User not authenticated')
    }

    console.log('Upserting settings:', { ...settings, user_id: user.id })

    const { data, error } = await supabase
      .from('user_settings')
      .upsert([{ 
        ...settings, 
        user_id: user.id,
        updated_at: new Date().toISOString() // Explicitly set updated_at
      }], {
        onConflict: 'user_id' // Specify conflict resolution
      })
      .select()
      .single()
    
    if (error) {
      console.error('Upsert error details:', {
        error,
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      })
      throw new Error(`Database error: ${error.message}`)
    }

    console.log('Upsert successful:', data)
    return data
  }
}