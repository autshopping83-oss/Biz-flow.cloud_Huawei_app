// src/features/auth/AuthContext.tsx
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { User, AuthError, AuthApiError } from '@supabase/supabase-js';
import { supabase } from '../../services/supabase';

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
}

const AuthContext = createContext<AuthContextValue | null>(null);

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [state, setState] = useState<AuthState>({ user: null, loading: true });

  useEffect(() => {
    let cancelled = false;

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!cancelled) setState({ user: session?.user ?? null, loading: false });
    });

    supabase.auth.getSession()
      .then(({ data: { session } }) => {
        if (!cancelled) setState({ user: session?.user ?? null, loading: false });
      })
      .catch(() => {
        if (!cancelled) setState({ user: null, loading: false });
      });

    return () => {
      cancelled = true;
      listener?.subscription.unsubscribe();
    };
  }, []);

  const extractError = (error: AuthError) => {
    if (error instanceof AuthApiError) {
      const messages: Record<string, string> = {
        invalid_credentials: 'Email ou senha inválidos.',
        email_not_confirmed: 'Confirme o seu email antes de entrar.',
        user_not_found: 'Utilizador não encontrado.',
        email_taken: 'Este email já está registado.',
        weak_password: 'A senha deve ter pelo menos 6 caracteres.',
      };
      return messages[error.code] || error.message;
    }
    return error.message;
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error ? extractError(error) : null };
  };

  const signUp = async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({ email, password });
    return { error: error ? extractError(error) : null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setState({ user: null, loading: false });
  };

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}?view=updatePassword`,
    });
    return { error: error ? extractError(error) : null };
  };

  const signInWithGoogle = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin },
    });
  };

  return (
    <AuthContext.Provider value={{ ...state, signIn, signUp, signOut, resetPassword, signInWithGoogle }}>
      {children}
    </AuthContext.Provider>
  );
};
