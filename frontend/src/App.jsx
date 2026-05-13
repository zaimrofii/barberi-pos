import React from 'react';
import MainLayout from './layouts/MainLayout';
import ProductList from './components/ProductList';
import CartPanel from './components/CartPanel';
import useCartStore from './stores/cartStore';
import useUIStore from './stores/uiStore';
import useOfflineSync from './hooks/useOfflineSync';
import useAutoSave from './hooks/useAutoSave';
import RecoveryPopup from './components/RecoveryPopup';
import { CART_BACKUP_KEY } from './utils/constants';

export default function App() {
  const { items, discount, getTotal, getItemCount } = useCartStore();
  const { setShowRecoveryPopup, setRecoveryCartData } = useUIStore();

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

  const handleSearch = (query) => {
    // Implement search logic
  };

  return (
    <MainLayout
      kasirName="Kasir"
      cartItemCount={getItemCount()}
      cartTotal={getTotal()}
      onCheckout={() => {}}
      onSearch={handleSearch}
      searchValue=""
      cartContent={<CartPanel />}
    >
      <ProductList />
      <RecoveryPopup />
    </MainLayout>
  );
}
