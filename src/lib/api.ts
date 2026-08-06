// src/lib/api.ts
import { supabase } from './supabase'
import type {
  BudgetTemplate,
  CategoryBudget,
  Expense,
  Income,
  SavingsContribution,
  SavingsGoal,
  TemplateItem,
  Transaction,
  UserSettings,
} from '@/types'

// Payload for creating a transaction (personal when group_id is omitted/null).
export type NewTransaction = Omit<Transaction, 'id' | 'created_at' | 'user_id'>

// Auth helper to ensure we have a valid session.
//
// getSession() reads the locally-stored, signature-verified JWT (and silently
// refreshes it when needed) — no network round-trip. We intentionally do NOT
// call getUser() here: it hits the Supabase auth server on *every* CRUD/init
// call, creating a request waterfall, and adds nothing — row-level security on
// the server is the real authorization boundary, and we still scope every query
// by user_id below as defence-in-depth.
async function ensureAuthenticated() {
  const { data: { session }, error: sessionError } = await supabase.auth.getSession()

  if (sessionError) {
    console.error('Session error:', sessionError)
    throw new Error('Failed to verify authentication')
  }

  if (!session?.user) {
    throw new Error('No active session - user needs to sign in')
  }

  return { user: session.user, session }
}

// Returns the current authenticated user's id (from the local session — no
// network round-trip). Throws if there is no active session.
export async function getCurrentUserId(): Promise<string> {
  const { user } = await ensureAuthenticated()
  return user.id
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
  // Personal expenses only (group_id IS NULL). Family rows are read via getForGroup.
  async getAll(): Promise<Expense[]> {
    return withAuth(async (userId) => {
      const { data, error } = await supabase
        .from('expenses')
        .select('*')
        .eq('user_id', userId)
        .is('group_id', null)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Expenses fetch error:', error)
        throw new Error(`Failed to fetch expenses: ${error.message}`)
      }
      return data || []
    })
  },

  // Shared expenses for a group (RLS grants reads to members).
  async getForGroup(groupId: string): Promise<Expense[]> {
    return withAuth(async () => {
      const { data, error } = await supabase
        .from('expenses')
        .select('*')
        .eq('group_id', groupId)
        .order('date', { ascending: false })

      if (error) throw new Error(`Failed to fetch group expenses: ${error.message}`)
      return data || []
    })
  },

  async create(expense: NewTransaction): Promise<Expense> {
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

  async createMany(rows: NewTransaction[]): Promise<Expense[]> {
    return withAuth(async (userId) => {
      const { data, error } = await supabase
        .from('expenses')
        .insert(rows.map((r) => ({ ...r, user_id: userId })))
        .select()

      if (error) throw new Error(`Failed to add expenses: ${error.message}`)
      return data || []
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
  // Personal income only (group_id IS NULL).
  async getAll(): Promise<Income[]> {
    return withAuth(async (userId) => {
      const { data, error } = await supabase
        .from('income')
        .select('*')
        .eq('user_id', userId)
        .is('group_id', null)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Income fetch error:', error)
        throw new Error(`Failed to fetch income: ${error.message}`)
      }
      return data || []
    })
  },

  // Shared income for a group (RLS grants reads to members).
  async getForGroup(groupId: string): Promise<Income[]> {
    return withAuth(async () => {
      const { data, error } = await supabase
        .from('income')
        .select('*')
        .eq('group_id', groupId)
        .order('date', { ascending: false })

      if (error) throw new Error(`Failed to fetch group income: ${error.message}`)
      return data || []
    })
  },

  async create(income: NewTransaction): Promise<Income> {
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

  async createMany(rows: NewTransaction[]): Promise<Income[]> {
    return withAuth(async (userId) => {
      const { data, error } = await supabase
        .from('income')
        .insert(rows.map((r) => ({ ...r, user_id: userId })))
        .select()

      if (error) throw new Error(`Failed to add income: ${error.message}`)
      return data || []
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

// Per-category monthly budget limits API
export const categoryBudgetsApi = {
  // Personal scope → the user's own budgets. Group scope → the group's shared budgets.
  async list(groupId: string | null): Promise<CategoryBudget[]> {
    return withAuth(async (userId) => {
      let q = supabase.from('category_budgets').select('*').order('category')
      q = groupId ? q.eq('group_id', groupId) : q.is('group_id', null).eq('user_id', userId)

      const { data, error } = await q
      if (error) throw new Error(`Failed to load budgets: ${error.message}`)
      return (data ?? []) as CategoryBudget[]
    })
  },

  // Create-or-update the limit for a category in a scope. Done as two steps
  // because the scope's uniqueness lives in partial indexes that PostgREST
  // upsert can't target.
  async set(input: {
    category: string
    monthlyLimit: number
    groupId: string | null
  }): Promise<CategoryBudget> {
    return withAuth(async (userId) => {
      let existing = supabase
        .from('category_budgets')
        .select('id')
        .eq('category', input.category)
      existing = input.groupId
        ? existing.eq('group_id', input.groupId)
        : existing.is('group_id', null).eq('user_id', userId)
      const { data: found, error: findError } = await existing.maybeSingle()
      if (findError) throw new Error(`Failed to save budget: ${findError.message}`)

      const query = found
        ? supabase
            .from('category_budgets')
            .update({ monthly_limit: input.monthlyLimit })
            .eq('id', found.id)
        : supabase.from('category_budgets').insert({
            user_id: userId,
            group_id: input.groupId,
            category: input.category,
            monthly_limit: input.monthlyLimit,
          })

      const { data, error } = await query.select().single()
      if (error) throw new Error(`Failed to save budget: ${error.message}`)
      return data as CategoryBudget
    })
  },

  async remove(id: string): Promise<void> {
    return withAuth(async () => {
      const { error } = await supabase.from('category_budgets').delete().eq('id', id)
      if (error) throw new Error(`Failed to delete budget: ${error.message}`)
    })
  },
}

// Budget / category templates API
export const templatesApi = {
  // Personal scope → the user's own personal templates.
  // Group scope    → the group's shared templates (any member's).
  async list(kind: 'expense' | 'income', groupId: string | null): Promise<BudgetTemplate[]> {
    return withAuth(async (userId) => {
      let q = supabase
        .from('budget_templates')
        .select('*')
        .eq('kind', kind)
        .order('created_at', { ascending: true })

      q = groupId
        ? q.eq('group_id', groupId)
        : q.is('group_id', null).eq('user_id', userId)

      const { data, error } = await q
      if (error) throw new Error(`Failed to load templates: ${error.message}`)
      return (data ?? []) as BudgetTemplate[]
    })
  },

  async create(input: {
    kind: 'expense' | 'income'
    name: string
    items: TemplateItem[]
    groupId: string | null
  }): Promise<BudgetTemplate> {
    return withAuth(async (userId) => {
      const { data, error } = await supabase
        .from('budget_templates')
        .insert({
          user_id: userId,
          group_id: input.groupId,
          kind: input.kind,
          name: input.name,
          items: input.items,
        })
        .select()
        .single()
      if (error) throw new Error(`Failed to save template: ${error.message}`)
      return data as BudgetTemplate
    })
  },

  async remove(id: string): Promise<void> {
    return withAuth(async () => {
      const { error } = await supabase.from('budget_templates').delete().eq('id', id)
      if (error) throw new Error(`Failed to delete template: ${error.message}`)
    })
  },

  // Enabling stamps last_applied with the current month so the cron job starts
  // NEXT month — the user likely already entered this month's items manually.
  async setAutoApply(id: string, autoApply: boolean): Promise<BudgetTemplate> {
    return withAuth(async () => {
      const patch = autoApply
        ? { auto_apply: true, last_applied: new Date().toISOString().slice(0, 7) }
        : { auto_apply: false }
      const { data, error } = await supabase
        .from('budget_templates')
        .update(patch)
        .eq('id', id)
        .select()
        .single()
      if (error) throw new Error(`Failed to update template: ${error.message}`)
      return data as BudgetTemplate
    })
  },
}

// Savings goals & contributions API (personal-only; savings are never expenses)
export type NewSavingsGoal = Omit<SavingsGoal, 'id' | 'created_at' | 'user_id'>
export type NewSavingsContribution = Omit<SavingsContribution, 'id' | 'created_at' | 'user_id'>

export const savingsApi = {
  // Personal goals (group_id IS NULL) or a group's shared goals (RLS grants
  // reads to members).
  async listGoals(groupId: string | null = null): Promise<SavingsGoal[]> {
    return withAuth(async (userId) => {
      let q = supabase
        .from('savings_goals')
        .select('*')
        .order('created_at', { ascending: true })

      q = groupId ? q.eq('group_id', groupId) : q.eq('user_id', userId).is('group_id', null)

      const { data, error } = await q
      if (error) throw new Error(`Failed to fetch savings goals: ${error.message}`)
      return data || []
    })
  },

  async createGoal(goal: NewSavingsGoal): Promise<SavingsGoal> {
    return withAuth(async (userId) => {
      const { data, error } = await supabase
        .from('savings_goals')
        .insert([{ ...goal, user_id: userId }])
        .select()
        .single()

      if (error) throw new Error(`Failed to create savings goal: ${error.message}`)
      return data
    })
  },

  async updateGoal(id: string, patch: Partial<NewSavingsGoal>): Promise<SavingsGoal> {
    return withAuth(async (userId) => {
      const { data, error } = await supabase
        .from('savings_goals')
        .update(patch)
        .eq('id', id)
        .eq('user_id', userId) // Security: ensure user owns this goal
        .select()
        .single()

      if (error) throw new Error(`Failed to update savings goal: ${error.message}`)
      return data
    })
  },

  // Cascades: deleting a goal removes its contributions (FK on delete cascade).
  async deleteGoal(id: string): Promise<void> {
    return withAuth(async (userId) => {
      const { error } = await supabase
        .from('savings_goals')
        .delete()
        .eq('id', id)
        .eq('user_id', userId)

      if (error) throw new Error(`Failed to delete savings goal: ${error.message}`)
    })
  },

  async listContributions(groupId: string | null = null): Promise<SavingsContribution[]> {
    return withAuth(async (userId) => {
      let q = supabase
        .from('savings_contributions')
        .select('*')
        .order('date', { ascending: false })

      q = groupId ? q.eq('group_id', groupId) : q.eq('user_id', userId).is('group_id', null)

      const { data, error } = await q
      if (error) throw new Error(`Failed to fetch contributions: ${error.message}`)
      return data || []
    })
  },

  async createContribution(input: NewSavingsContribution): Promise<SavingsContribution> {
    return withAuth(async (userId) => {
      const { data, error } = await supabase
        .from('savings_contributions')
        .insert([{ ...input, user_id: userId }])
        .select()
        .single()

      if (error) throw new Error(`Failed to add contribution: ${error.message}`)
      return data
    })
  },

  async deleteContribution(id: number): Promise<void> {
    return withAuth(async (userId) => {
      const { error } = await supabase
        .from('savings_contributions')
        .delete()
        .eq('id', id)
        .eq('user_id', userId)

      if (error) throw new Error(`Failed to delete contribution: ${error.message}`)
    })
  },
}

/**
 * Multiply every personal-scope amount by `rate` server-side (expenses, income,
 * savings, budgets, template items). Group rows are untouched — they're shared.
 */
export async function convertPersonalAmounts(rate: number): Promise<void> {
  const { error } = await supabase.rpc('convert_personal_amounts', { p_rate: rate })
  if (error) throw new Error(`Failed to convert amounts: ${error.message}`)
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