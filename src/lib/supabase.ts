import { createClient } from "@supabase/supabase-js";
import { create } from "domain";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface Expense {
  id?: number;
  category: string;
  name: string;
  amount: number;
  created_at?: string;
  user_id?: string;
}

export interface Income {
  id?: number;
  category: string;
  name: string;
  amount: number;
  created_at?: string;
  user_id?: string;
}

export interface UserSettings {
  id?: number;
  user_id: string;
  currency: string;
  created_at?: string;
  updated_at?: string;
}
