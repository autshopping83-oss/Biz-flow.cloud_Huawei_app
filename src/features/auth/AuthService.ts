// src/features/auth/AuthService.ts
// Serviço de autenticação para Android - guest-first, Supabase opcional

import { supabase, isSupabaseAvailable } from '../../services/supabase';

const getRedirectUrl = () => {
  if (typeof window !== 'undefined' && !!(window as any).Capacitor?.isNativePlatform?.()) {
    return 'bizflow://auth/callback';
  }
  return window.location.origin;
};

export const AuthService = {
  async signIn(email: string, password: string) {
    if (!isSupabaseAvailable()) return { error: 'Supabase não configurado. Defina VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY.' };
    const { data, error } = await supabase!.auth.signInWithPassword({ email, password });
    if (error) return { error: mapAuthError(error) };
    if (!data.user) return { error: 'Erro ao autenticar. Tente novamente.' };

    return {
      error: null,
      user: { id: data.user.id, email: data.user.email ?? email },
    };
  },

  async signUp(email: string, password: string) {
    if (!isSupabaseAvailable()) return { error: 'Supabase não configurado.' };
    const { data, error } = await supabase!.auth.signUp({ email, password });
    if (error) return { error: mapAuthError(error) };
    if (!data.user) return { error: 'Erro ao criar conta. Tente novamente.' };

    return {
      error: null,
      user: { id: data.user.id, email: data.user.email ?? email },
    };
  },

  async signOut() {
    if (isSupabaseAvailable()) {
      const { error } = await supabase!.auth.signOut();
      if (error) console.warn('SignOut error:', error.message);
    }
  },

  async resetPassword(email: string) {
    if (!isSupabaseAvailable()) return { error: 'Supabase não configurado.' };
    const { error } = await supabase!.auth.resetPasswordForEmail(email, {
      redirectTo: `${getRedirectUrl()}?view=updatePassword`,
    });
    return { error: error ? mapAuthError(error) : null };
  },

  async signInWithGoogle() {
    if (!isSupabaseAvailable()) return { error: 'Supabase não configurado.' };
    const { error } = await supabase!.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: getRedirectUrl() },
    });
    if (error) return { error: mapAuthError(error) };
    return { error: null };
  },
};

function mapAuthError(error: { code?: string; message: string }) {
  const messages: Record<string, string> = {
    invalid_credentials: 'Email ou senha inválidos.',
    email_not_confirmed: 'Confirme o seu email antes de entrar.',
    user_not_found: 'Utilizador não encontrado.',
    email_taken: 'Este email já está registado.',
    weak_password: 'A senha deve ter pelo menos 6 caracteres.',
  };
  return messages[error.code ?? ''] || error.message;
}
