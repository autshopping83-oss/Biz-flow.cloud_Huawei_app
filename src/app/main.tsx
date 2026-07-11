import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { ToastProvider } from '../components/ToastContext';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { AuthProvider } from '../features/auth/AuthContext';
import '../index.css';
import '@fortawesome/fontawesome-free/css/all.min.css';

// --- GLOBAL TYPES ---
declare global {
  interface Window {
    Capacitor?: {
      isNativePlatform: () => boolean;
    };
  }
}

// --- CAPACITOR INIT (Android) ---
const initCapacitor = async () => {
  if (window.Capacitor?.isNativePlatform()) {
    try {
      const { StatusBar, Style } = await import('@capacitor/status-bar');
      await StatusBar.setStyle({ style: Style.Light });
      await StatusBar.setBackgroundColor({ color: '#ffffff' });
    } catch {
      // Silencioso — pode não estar disponível
    }

    // Safe area CSS
    document.documentElement.style.setProperty('--safe-area-bottom', 'env(safe-area-inset-bottom, 0px)');
  }
};

initCapacitor();

// --- INITIALIZATION ---
const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <AuthProvider>
        <ToastProvider>
          <App />
        </ToastProvider>
      </AuthProvider>
    </ErrorBoundary>
  </React.StrictMode>
);
