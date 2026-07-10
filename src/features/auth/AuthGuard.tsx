// src/features/auth/AuthGuard.tsx
import { type ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { AuthPage } from './AuthPage';

export const AuthGuard = ({ children }: { children: ReactNode }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-slate-900 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 rounded-full border-[3px] border-slate-200 dark:border-slate-700 border-t-blue-600 dark:border-t-blue-500 animate-spin" />
          <p className="text-sm text-slate-500">A carregar...</p>
        </div>
      </div>
    );
  }

  if (!user) return <AuthPage />;

  return <>{children}</>;
};
