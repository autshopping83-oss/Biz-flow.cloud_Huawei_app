// src/features/auth/AuthContext.tsx
// AuthContext para Android - guest-first, conexão opcional com Supabase
// Suporta modo offline (sem credenciais Supabase)

import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import type { User } from '@supabase/supabase-js';
import { supabase, isSupabaseAvailable } from '../../services/supabase';

interface AuthState {
  user: User | null;
  loading: boolean;
}

interface AuthContextValue extends AuthState {
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: string | null }>;
  signInWithGoogle: () => Promise<void>;
  isConnected: boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [state, setState] = useState<AuthState>({ user: null, loading: true });
  const loadingRef = useRef(true);

  // On mount: check Supabase session if available, otherwise go straight to guest
  useEffect(() => {
    let cancelled = false;

    if (!isSupabaseAvailable()) {
      // No Supabase credentials - skip auth, go directly to guest mode
      loadingRef.current = false;
      setState({ user: null, loading: false });
      return;
    }

    const { data: listener } = supabase!.auth.onAuthStateChange((event, session) => {
      if (cancelled) return;
      if (event === 'INITIAL_SESSION' || event === 'TOKEN_REFRESHED') return;
      loadingRef.current = false;
      setState({ user: session?.user ?? null, loading: false });
    });

    supabase!.auth.getSession()
      .then(({ data: { session } }) => {
        if (cancelled) return;
        if (session?.user) {
          loadingRef.current = false;
          setState({ user: session.user, loading: false });
        } else if (loadingRef.current) {
          loadingRef.current = false;
          setState({ user: null, loading: false });
        }
      })
      .catch(() => {
        if (!cancelled && loadingRef.current) {
          loadingRef.current = false;
          setState({ user: null, loading: false });
        }
      });

    return () => {
      cancelled = true;
      listener?.subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    if (!isSupabaseAvailable()) return { error: 'Sem conexão com o servidor. Verifique as credenciais Supabase.' };
    const { error } = await supabase!.auth.signInWithPassword({ email, password });
    if (error) return { error: extractErrorMessage(error) };
    return { error: null };
  };

  const signUp = async (email: string, password: string) => {
    if (!isSupabaseAvailable()) return { error: 'Sem conexão com o servidor.' };
    const { error } = await supabase!.auth.signUp({ email, password });
    return { error: error ? extractErrorMessage(error) : null };
  };

  const signOut = async () => {
    if (isSupabaseAvailable()) {
      await supabase!.auth.signOut();
    }
    setState({ user: null, loading: false });
  };

  const resetPassword = async (email: string) => {
    if (!isSupabaseAvailable()) return { error: 'Sem conexão com o servidor.' };
    const { error } = await supabase!.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}?view=updatePassword`,
    });
    return { error: error ? extractErrorMessage(error) : null };
  };

  const signInWithGoogle = async () => {
    if (!isSupabaseAvailable()) return;
    await supabase!.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin },
    });
  };

  const extractErrorMessage = (error: { code?: string; message: string }) => {
    const messages: Record<string, string> = {
      invalid_credentials: 'Email ou senha inválidos.',
      email_not_confirmed: 'Confirme o seu email antes de entrar.',
      user_not_found: 'Utilizador não encontrado.',
      email_taken: 'Este email já está registado.',
      weak_password: 'A senha deve ter pelo menos 6 caracteres.',
    };
    return messages[error.code ?? ''] || error.message;
  };

  return (
    <AuthContext.Provider value={{
      ...state,
      signIn,
      signUp,
      signOut,
      resetPassword,
      signInWithGoogle,
      isConnected: !!state.user,
    }}>
      {children}
    </AuthContext.Provider>
  );
};
