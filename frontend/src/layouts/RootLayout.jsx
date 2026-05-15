import React from 'react';
import { Outlet } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import AutoSaveIndicator from '../components/AutoSaveIndicator';
import useOfflineSync from '../hooks/useOfflineSync';
import useAutoSave from '../hooks/useAutoSave';
import useUIStore from '../stores/uiStore';
import { CART_BACKUP_KEY } from '../utils/constants';

export default function RootLayout() {
  const { setShowRecoveryPopup, setRecoveryCartData, openSyncModal } = useUIStore();
  
  // Initialize offline sync
  useOfflineSync();
  
  // Initialize auto-save
  useAutoSave();

  // Check for backup on mount
  React.useEffect(() => {
    try {
      const backup = localStorage.getItem(CART_BACKUP_KEY);
      if (backup) {
        const parsed = JSON.parse(backup);
        if (parsed.items && parsed.items.length > 0) {
          setRecoveryCartData(parsed);
          setShowRecoveryPopup(true);
        }
      }
    } catch (e) {
      console.error('Failed to check backup:', e);
    }
  }, []);

  // Listen for custom event to open sync modal
  React.useEffect(() => {
    const handleOpenSyncModal = () => openSyncModal();
    window.addEventListener('pos:open-sync-modal', handleOpenSyncModal);
    return () => window.removeEventListener('pos:open-sync-modal', handleOpenSyncModal);
  }, [openSyncModal]);

  return (
    <>
      <Toaster
        position="bottom-center"
        toastOptions={{
          duration: 3000,
          style: {
            background: '#1f2937',
            color: '#fff',
            borderRadius: '12px',
            padding: '12px 16px',
            fontSize: '14px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          },
          success: {
            iconTheme: { primary: '#10b981', secondary: '#fff' },
          },
          error: {
            iconTheme: { primary: '#ef4444', secondary: '#fff' },
          },
        }}
      />
      <Outlet />
      <AutoSaveIndicator />
    </>
  );
}
