import { useEffect, useRef } from 'react';
import { getDirectoryHandle, getHistory, getSavedClients, getSavedProducts, getCompanySettings } from '../../services/storageService';
import { CompanySettings, ReceiptData, SavedClient, SavedProduct } from '../../types';

interface UseAppLifecycleParams {
  userId: string;
  currentView: string;
  isGuest: boolean;
  setCurrentView: (view: string) => void;
  setIsGuest: (guest: boolean) => void;
  setHistory: (history: ReceiptData[]) => void;
  setSavedClients: (clients: SavedClient[]) => void;
  setSavedProducts: (products: SavedProduct[]) => void;
  setCompanySettings: React.Dispatch<React.SetStateAction<CompanySettings>>;
  setIsOnline: (online: boolean) => void;
  setLocalDirHandle: (handle: FileSystemDirectoryHandle | null) => void;
  onReady?: () => void;
}

export const useAppLifecycle = ({
  userId,
  currentView,
  isGuest,
  setCurrentView,
  setIsGuest,
  setHistory,
  setSavedClients,
  setSavedProducts,
  setCompanySettings,
  setIsOnline,
  setLocalDirHandle,
  onReady,
}: UseAppLifecycleParams) => {
  const initializingRef = useRef(false);
  const onReadyCalledRef = useRef(false);

  // Setup side effects once (listeners, etc.)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const view = params.get('view');
    if (view === 'updatePassword') {
      setCurrentView('updatePassword');
    }

    getDirectoryHandle().then(handle => {
      if (handle) setLocalDirHandle(handle);
    });

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Load data when userId changes (first load and after login)
  useEffect(() => {
    if (!userId) return;
    loadLocalData();
  }, [userId]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadLocalData = async () => {
    if (initializingRef.current) return;
    initializingRef.current = true;

    try {
      setIsGuest(false);
      
      // Load settings from local storage
      const localSettings = await getCompanySettings(userId);
      if (localSettings) {
        setCompanySettings(prev => ({ ...prev, ...localSettings, plan: 'PRO' }));
        
        // Apply theme from settings
        const theme = localSettings.theme || 'light';
        if (theme === 'dark') {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      } else {
        // Check localStorage for theme preference
        const savedTheme = localStorage.getItem('bizflow-theme') || 'light';
        if (savedTheme === 'dark') {
          document.documentElement.classList.add('dark');
        }
      }

      // Load history, clients, products from local storage
      const hist = await getHistory(userId);
      setHistory(hist);
      setSavedClients(await getSavedClients(userId));
      setSavedProducts(await getSavedProducts(userId));

      // Navigate to home if on loading screen
      if (['loading', 'login', 'register', 'forgotPassword'].includes(currentView)) {
        setCurrentView('home');
      }

      if (!onReadyCalledRef.current) {
        onReadyCalledRef.current = true;
        onReady?.();
      }
    } catch (error) {
      console.error('loadLocalData error:', error);
      // Fallback: show home even with error
      if (['loading', 'login', 'register', 'forgotPassword'].includes(currentView)) {
        setCurrentView('home');
      }
    } finally {
      initializingRef.current = false;
    }
  };

  return { loadLocalData };
};
