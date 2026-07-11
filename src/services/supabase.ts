// src/services/supabase.ts
// Cliente Supabase resiliente - funciona sem credenciais para modo offline
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

const hasCredentials = !!supabaseUrl && !!supabaseAnonKey;

// Cria o cliente apenas se as credenciais existirem
export const supabase = hasCredentials
  ? createClient(supabaseUrl!, supabaseAnonKey!, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null;

// Helper para verificar se Supabase está disponível
export const isSupabaseAvailable = () => !!supabase;
