// src/features/auth/AuthService.ts
// Serviço de autenticação para Android - guest-first, Supabase opcional

import { supabase } from '../../services/supabase';

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  email: string;
  userId: string;
}

export const AuthService = {
  async signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { error: mapAuthError(error) };
    if (!data.user) return { error: 'Erro ao autenticar. Tente novamente.' };

    return {
      error: null,
      user: {
        id: data.user.id,
        email: data.user.email ?? email,
      },
    };
  },

  async signUp(email: string, password: string) {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) return { error: mapAuthError(error) };
    if (!data.user) return { error: 'Erro ao criar conta. Tente novamente.' };

    return {
      error: null,
      user: {
        id: data.user.id,
        email: data.user.email ?? email,
      },
    };
  },

  async signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) console.warn('SignOut error:', error.message);
  },

  async resetPassword(email: string) {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}?view=updatePassword`,
    });
    return { error: error ? mapAuthError(error) : null };
  },

  async signInWithGoogle() {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin },
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
