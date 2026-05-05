import React from 'react';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log seguro - apenas em DEV mostra detalhes
    if (import.meta.env.DEV) {
      console.error('ErrorBoundary caught:', error, errorInfo);
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-red-50 to-red-100 dark:from-slate-900 dark:to-slate-950">
          <div className="text-center max-w-md p-6">
            <div className="text-6xl mb-6">⚠️</div>
            <h1 className="text-3xl font-bold text-red-600 dark:text-red-400 mb-4">Oops! Algo correu mal</h1>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              A aplicação encontrou um erro inesperado. Por favor, tente recarregar a página.
            </p>
            <button
              onClick={() => window.location.href = '/'}
              className="px-6 py-3 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition shadow-lg shadow-red-600/20"
            >
              Recarregar Página
            </button>
            {import.meta.env.DEV && this.state.error && (
              <details className="mt-6 text-left text-xs text-gray-500">
                <summary className="cursor-pointer font-medium">Detalhes do Erro (apenas DEV)</summary>
                <pre className="mt-2 p-2 bg-gray-900 text-gray-100 rounded overflow-auto max-h-40">
                  {this.state.error.toString()}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
