import { useEffect, useCallback, useRef } from 'react';
import useCartStore from '../stores/cartStore';
import useUIStore from '../stores/uiStore';
import toast from 'react-hot-toast';

export default function useKeyboardShortcuts() {
  const {
    items,
    updateQuantity,
    removeItem,
    pushToHistory,
    undo,
    clearCart,
  } = useCartStore();
  const {
    isSyncModalOpen,
    isRecoveryPopupOpen,
    openDiscountModal,
    openQuickPickModal,
    closeModal,
  } = useUIStore();

  const selectedItemIndex = useRef(-1);
  const lastAction = useRef(null);

  // Track selected item index
  const handleItemSelect = useCallback((index) => {
    selectedItemIndex.current = index;
  }, []);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Don't handle shortcuts when typing in input fields
      if (
        e.target.tagName === 'INPUT' ||
        e.target.tagName === 'TEXTAREA' ||
        e.target.isContentEditable
      ) {
        return;
      }

      // Context-aware: if modal is open, ESC closes modal
      if (e.key === 'Escape') {
        if (isSyncModalOpen || isRecoveryPopupOpen) {
          closeModal();
          return;
        }
        // Clear cart with confirmation
        if (items.length > 0) {
          if (window.confirm('Hapus semua item dari keranjang?')) {
            pushToHistory();
            clearCart();
            toast.success('Keranjang dikosongkan');
          }
        }
        return;
      }

      // F1: Focus search input
      if (e.key === 'F1') {
        e.preventDefault();
        const searchInput = document.querySelector('[data-search-input]');
        if (searchInput) {
          searchInput.focus();
          searchInput.select();
          toast.success('🔍 Cari produk', { duration: 1000 });
        }
        return;
      }

      // F2: Trigger checkout
      if (e.key === 'F2') {
        e.preventDefault();
        if (items.length > 0) {
          const checkoutBtn = document.querySelector('[data-checkout-btn]');
          if (checkoutBtn) {
            checkoutBtn.click();
            toast.success('💰 Memproses pembayaran...', { duration: 1000 });
          }
        }
        return;
      }

      // F3: Open discount modal
      if (e.key === 'F3') {
        e.preventDefault();
        openDiscountModal();
        // Focus discount input after modal opens
        setTimeout(() => {
          const discountInput = document.querySelector('[data-discount-input]');
          if (discountInput) {
            discountInput.focus();
            discountInput.select();
          }
        }, 100);
        toast.success('🏷️ Diskon', { duration: 1000 });
        return;
      }

      // F4: Open quick product pick modal
      if (e.key === 'F4') {
        e.preventDefault();
        openQuickPickModal();
        toast.success('➕ Pilih produk cepat', { duration: 1000 });
        return;
      }

      // Ctrl+Z: Undo last cart action
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault();
        const success = undo();
        if (success) {
          toast.success('↩️ Undo berhasil', { duration: 1000 });
        } else {
          toast.error('Tidak ada aksi yang bisa di-undo', { duration: 1000 });
        }
        return;
      }

      // NumPad + : Increase quantity of selected item
      if (e.key === '+' || e.key === 'Add') {
        e.preventDefault();
        if (selectedItemIndex.current >= 0 && selectedItemIndex.current < items.length) {
          const item = items[selectedItemIndex.current];
          pushToHistory();
          updateQuantity(item.id, item.quantity + 1);
          toast.success(`➕ ${item.name} +1`, { duration: 800 });
        }
        return;
      }

      // NumPad - : Decrease quantity of selected item
      if (e.key === '-' || e.key === 'Subtract') {
        e.preventDefault();
        if (selectedItemIndex.current >= 0 && selectedItemIndex.current < items.length) {
          const item = items[selectedItemIndex.current];
          if (item.quantity > 1) {
            pushToHistory();
            updateQuantity(item.id, item.quantity - 1);
            toast.success(`➖ ${item.name} -1`, { duration: 800 });
          } else {
            pushToHistory();
            removeItem(item.id);
            toast.success(`🗑️ ${item.name} dihapus`, { duration: 800 });
          }
        }
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    items,
    updateQuantity,
    removeItem,
    pushToHistory,
    undo,
    clearCart,
    isSyncModalOpen,
    isRecoveryPopupOpen,
    openDiscountModal,
    openQuickPickModal,
    closeModal,
  ]);

  return {
    handleItemSelect,
    selectedItemIndex,
  };
}
import { useEffect, useCallback, useRef } from 'react';
import useCartStore from '../stores/cartStore';
import useUIStore from '../stores/uiStore';
import toast from 'react-hot-toast';

export default function useKeyboardShortcuts() {
  const {
    items,
    updateQuantity,
    removeItem,
    pushToHistory,
    undo,
    clearCart,
  } = useCartStore();
  const {
    isSyncModalOpen,
    isRecoveryPopupOpen,
    openDiscountModal,
    openQuickPickModal,
    closeModal,
  } = useUIStore();

  const selectedItemIndex = useRef(-1);

  // Track selected item index
  const handleItemSelect = useCallback((index) => {
    selectedItemIndex.current = index;
  }, []);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Don't handle shortcuts when typing in input fields
      if (
        e.target.tagName === 'INPUT' ||
        e.target.tagName === 'TEXTAREA' ||
        e.target.isContentEditable
      ) {
        return;
      }

      // Context-aware: if modal is open, ESC closes modal
      if (e.key === 'Escape') {
        if (isSyncModalOpen || isRecoveryPopupOpen) {
          closeModal();
          return;
        }
        // Clear cart with confirmation
        if (items.length > 0) {
          if (window.confirm('Hapus semua item dari keranjang?')) {
            pushToHistory();
            clearCart();
            toast.success('Keranjang dikosongkan');
          }
        }
        return;
      }

      // F1: Focus search input
      if (e.key === 'F1') {
        e.preventDefault();
        const searchInput = document.querySelector('[data-search-input]');
        if (searchInput) {
          searchInput.focus();
          searchInput.select();
          toast.success('🔍 Cari produk', { duration: 1000 });
        }
        return;
      }

      // F2: Trigger checkout
      if (e.key === 'F2') {
        e.preventDefault();
        if (items.length > 0) {
          const checkoutBtn = document.querySelector('[data-checkout-btn]');
          if (checkoutBtn) {
            checkoutBtn.click();
            toast.success('💰 Memproses pembayaran...', { duration: 1000 });
          }
        }
        return;
      }

      // F3: Open discount modal
      if (e.key === 'F3') {
        e.preventDefault();
        openDiscountModal();
        // Focus discount input after modal opens
        setTimeout(() => {
          const discountInput = document.querySelector('[data-discount-input]');
          if (discountInput) {
            discountInput.focus();
            discountInput.select();
          }
        }, 100);
        toast.success('🏷️ Diskon', { duration: 1000 });
        return;
      }

      // F4: Open quick product pick modal
      if (e.key === 'F4') {
        e.preventDefault();
        openQuickPickModal();
        toast.success('➕ Pilih produk cepat', { duration: 1000 });
        return;
      }

      // Ctrl+Z: Undo last cart action
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault();
        const success = undo();
        if (success) {
          toast.success('↩️ Undo berhasil', { duration: 1000 });
        } else {
          toast.error('Tidak ada aksi yang bisa di-undo', { duration: 1000 });
        }
        return;
      }

      // NumPad + : Increase quantity of selected item
      if (e.key === '+' || e.key === 'Add') {
        e.preventDefault();
        if (selectedItemIndex.current >= 0 && selectedItemIndex.current < items.length) {
          const item = items[selectedItemIndex.current];
          pushToHistory();
          updateQuantity(item.id, item.quantity + 1);
          toast.success(`➕ ${item.name} +1`, { duration: 800 });
        }
        return;
      }

      // NumPad - : Decrease quantity of selected item
      if (e.key === '-' || e.key === 'Subtract') {
        e.preventDefault();
        if (selectedItemIndex.current >= 0 && selectedItemIndex.current < items.length) {
          const item = items[selectedItemIndex.current];
          if (item.quantity > 1) {
            pushToHistory();
            updateQuantity(item.id, item.quantity - 1);
            toast.success(`➖ ${item.name} -1`, { duration: 800 });
          } else {
            pushToHistory();
            removeItem(item.id);
            toast.success(`🗑️ ${item.name} dihapus`, { duration: 800 });
          }
        }
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    items,
    updateQuantity,
    removeItem,
    pushToHistory,
    undo,
    clearCart,
    isSyncModalOpen,
    isRecoveryPopupOpen,
    openDiscountModal,
    openQuickPickModal,
    closeModal,
  ]);

  return {
    handleItemSelect,
    selectedItemIndex,
  };
}
