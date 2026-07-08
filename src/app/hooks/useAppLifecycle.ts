import { useEffect, useRef } from 'react';
import { getDirectoryHandle, getHistory, getSavedClients, getSavedProducts, getCompanySettings } from '../../services/storageService';
import { CompanySettings, ReceiptData, SavedClient, SavedProduct } from '../../types';

interface UseAppLifecycleParams {
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

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const view = params.get('view');

    if (view === 'updatePassword') {
      setCurrentView('updatePassword');
    }

    // Load local data on mount
    loadLocalData();

    getDirectoryHandle().then(handle => {
      if (handle) setLocalDirHandle(handle);
    });

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    onReady?.();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const loadLocalData = async () => {
    if (initializingRef.current) return;
    initializingRef.current = true;

    try {
      setIsGuest(false);
      
      // Load settings from local storage
      const localSettings = await getCompanySettings('local');
      if (localSettings) {
        setCompanySettings(prev => ({ ...prev, ...localSettings, plan: 'PRO' }));
      }

      // Load history, clients, products from local storage
      const hist = await getHistory('local');
      setHistory(hist);
      setSavedClients(await getSavedClients('local'));
      setSavedProducts(await getSavedProducts('local'));

      // Navigate to home if on loading screen
      if (['loading', 'login', 'register', 'forgotPassword'].includes(currentView)) {
        setCurrentView('home');
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
