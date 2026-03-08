
import React, { Component, ErrorInfo, ReactNode } from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { ToastProvider } from './components/ToastContext';

interface ErrorBoundaryProps {
  children?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

// --- ERROR BOUNDARY COMPONENT ---
// Captura erros de renderização para evitar a "Tela Branca da Morte"
class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  public state: ErrorBoundaryState = {
    hasError: false,
    error: null
  };

  // Explicitly declare props to satisfy TypeScript if inference fails
  declare props: Readonly<ErrorBoundaryProps>;

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '40px', textAlign: 'center', fontFamily: 'sans-serif', color: '#333' }}>
          <h1 style={{ fontSize: '24px', marginBottom: '10px' }}>Oops! Algo correu mal.</h1>
          <p style={{ marginBottom: '20px', color: '#666' }}>A aplicação encontrou um erro inesperado.</p>
          <div style={{ background: '#f8d7da', color: '#721c24', padding: '15px', borderRadius: '8px', marginBottom: '20px', textAlign: 'left', overflow: 'auto' }}>
            <code style={{ fontSize: '12px' }}>{this.state.error?.message}</code>
          </div>
          <button 
            onClick={() => window.location.reload()} 
            style={{ backgroundColor: '#2563EB', color: 'white', border: 'none', padding: '12px 24px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}
          >
            Recarregar Página
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

// --- INITIALIZATION ---

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

// --- SERVICE WORKER REGISTRATION (PWA) ---
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    // IMPORTANTE: Usar './service-worker.js' (relativo) em vez de '/service-worker.js' (absoluto)
    // para evitar erros de origem em ambientes de preview como AI Studio.
    navigator.serviceWorker
      .register('./service-worker.js')
      .then((registration) => {
        console.log('SW registered successfully: ', registration.scope);
      })
      .catch((registrationError) => {
        console.log('SW registration failed: ', registrationError);
      });
  });
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <ToastProvider>
        <App />
      </ToastProvider>
    </ErrorBoundary>
  </React.StrictMode>
);
