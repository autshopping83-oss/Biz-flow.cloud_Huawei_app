// src/features/auth/AuthContext.tsx
import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
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
  const loadingRef = useRef(true);

  useEffect(() => {
    let cancelled = false;

    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (cancelled) return;
      // Ignorar INITIAL_SESSION (vem sempre antes de SIGNED_IN)
      // e TOKEN_REFRESHED (mesmo user, re-render desnecessário)
      if (event === 'INITIAL_SESSION' || event === 'TOKEN_REFRESHED') return;
      loadingRef.current = false;
      setState({ user: session?.user ?? null, loading: false });

      // Sync profile to Supabase on sign in
      if (event === 'SIGNED_IN' && session?.user) {
        syncProfile(session.user).catch(() => {});
      }
    });

    // Fallback: se onAuthStateChange não disparar SIGNED_IN (ex: rede),
    // getSession() garante que loading termina
    supabase.auth.getSession()
      .then(({ data: { session } }) => {
        if (!cancelled && loadingRef.current) {
          loadingRef.current = false;
          setState({ user: session?.user ?? null, loading: false });
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
    // O listener onAuthStateChange já trata de limpar o estado
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

  const syncProfile = async (user: User) => {
    const { error } = await supabase.from('profiles').upsert({
      id: user.id,
      email: user.email,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'id' });
    if (error) console.warn('Profile sync error:', error.message);
  };

  return (
    <AuthContext.Provider value={{ ...state, signIn, signUp, signOut, resetPassword, signInWithGoogle }}>
      {children}
    </AuthContext.Provider>
  );
};
