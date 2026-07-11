// src/features/auth/AuthContext.tsx
// AuthContext para Android - guest-first, conexão opcional com Supabase

import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '../../services/supabase';

interface AuthState {
  user: User | null;
  loading: boolean;
}

interface StoredAuth {
  userId: string;
  email: string;
  connectedAt: number;
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

const AUTH_STORAGE_KEY = 'bizflow_auth_state';

const getStoredAuth = (): StoredAuth | null => {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

const setStoredAuth = (auth: StoredAuth | null) => {
  if (auth) {
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(auth));
  } else {
    localStorage.removeItem(AUTH_STORAGE_KEY);
  }
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [state, setState] = useState<AuthState>({ user: null, loading: true });
  const loadingRef = useRef(true);

  // Check stored auth on mount - tries Supabase session, falls back to stored credentials
  useEffect(() => {
    let cancelled = false;

    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (cancelled) return;
      if (event === 'INITIAL_SESSION' || event === 'TOKEN_REFRESHED') return;
      loadingRef.current = false;
      setState({ user: session?.user ?? null, loading: false });
    });

    // Try to restore session from Supabase
    supabase.auth.getSession()
      .then(({ data: { session } }) => {
        if (cancelled) return;
        if (session?.user) {
          loadingRef.current = false;
          setState({ user: session.user, loading: false });
          // Store auth reference
          setStoredAuth({
            userId: session.user.id,
            email: session.user.email ?? '',
            connectedAt: Date.now(),
          });
        } else {
          // No Supabase session - check stored auth fallback
          const stored = getStoredAuth();
          if (stored) {
            // We have stored credentials but no session - show as connected
            // The user will need to login again for sync operations
          }
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
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { error: extractErrorMessage(error) };
    // Auth state will be updated by the onAuthStateChange listener
    return { error: null };
  };

  const signUp = async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({ email, password });
    return { error: error ? extractErrorMessage(error) : null };
  };

  const signOut = async () => {
    setStoredAuth(null);
    await supabase.auth.signOut();
    setState({ user: null, loading: false });
  };

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}?view=updatePassword`,
    });
    return { error: error ? extractErrorMessage(error) : null };
  };

  const signInWithGoogle = async () => {
    await supabase.auth.signInWithOAuth({
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
