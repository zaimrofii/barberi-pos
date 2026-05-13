import React, { useState } from 'react';
import { Toaster } from 'react-hot-toast';
import MainLayout from './layouts/MainLayout';
import ProductGrid from './components/ProductGrid';
import CartPanel from './components/CartPanel';
import History from './pages/History';
import CommissionReport from './pages/CommissionReport';
import AutoSaveIndicator from './components/AutoSaveIndicator';
import useCartStore from './stores/cartStore';
import useUIStore from './stores/uiStore';
import useOfflineSync from './hooks/useOfflineSync';
import useAutoSave from './hooks/useAutoSave';
import RecoveryPopup from './components/RecoveryPopup';
import SyncQueueModal from './components/SyncQueueModal';
import { CART_BACKUP_KEY } from './utils/constants';

export default function App() {
  const { items, discount, getTotal, getItemCount } = useCartStore();
  const { setShowRecoveryPopup, setRecoveryCartData, openSyncModal, isOnline } = useUIStore();

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

  const [activeTab, setActiveTab] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [mobileCartOpen, setMobileCartOpen] = useState(false)

  const handleSearch = (query) => {
    // Implement search logic
  };

  // Simple routing based on hash
  const hash = window.location.hash || '#pos';
  const showHistory = hash === '#history';
  const showReports = hash === '#reports';

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
            iconTheme: {
              primary: '#10b981',
              secondary: '#fff',
            },
          },
          error: {
            iconTheme: {
              primary: '#ef4444',
              secondary: '#fff',
            },
          },
        }}
      />
      {showHistory ? (
        <div className="min-h-screen bg-gray-50">
          <header className="bg-gray-900 text-white px-4 py-3">
            <div className="flex items-center justify-between">
              <h1 className="font-bold text-lg">Riwayat Transaksi</h1>
              <div className="flex items-center gap-4">
                <a href="#reports" className="text-sm text-green-400 hover:text-green-300">
                  Laporan Komisi
                </a>
                <a href="#pos" className="text-sm text-green-400 hover:text-green-300">
                  Kembali ke POS
                </a>
              </div>
            </div>
          </header>
          <History />
        </div>
      ) : showReports ? (
        <div className="min-h-screen bg-gray-50">
          <header className="bg-gray-900 text-white px-4 py-3">
            <div className="flex items-center justify-between">
              <h1 className="font-bold text-lg">Laporan Komisi</h1>
              <div className="flex items-center gap-4">
                <a href="#history" className="text-sm text-green-400 hover:text-green-300">
                  Riwayat Transaksi
                </a>
                <a href="#pos" className="text-sm text-green-400 hover:text-green-300">
                  Kembali ke POS
                </a>
              </div>
            </div>
          </header>
          <CommissionReport />
        </div>
      ) : (
        <MainLayout
          kasirName="Kasir"
          cartItemCount={getItemCount()}
          cartTotal={getTotal()}
          onCheckout={() => {}}
          onSearch={handleSearch}
          searchValue=""
          cartContent={
            <CartPanel
              isMobileOpen={mobileCartOpen}
              onMobileClose={() => setMobileCartOpen(false)}
              isOffline={!isOnline}
            />
          }
        >
          <ProductGrid
            activeTab={activeTab}
            onTabChange={setActiveTab}
            searchQuery={searchQuery}
            onSearch={setSearchQuery}
          />
          <RecoveryPopup />
          <SyncQueueModal />
        </MainLayout>
      )}
      <AutoSaveIndicator />
    </>
  );
}
