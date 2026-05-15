import React from 'react';
import { Dialog } from '@headlessui/react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import useUIStore from '../stores/uiStore';
import useCartStore from '../stores/cartStore';
import { CART_BACKUP_KEY } from '../utils/constants';

export default function RecoveryPopup() {
  const { showRecoveryPopup, recoveryCartData, setShowRecoveryPopup, setRecoveryCartData } = useUIStore();
  const { addItem, clearCart } = useCartStore();

  const handleRestore = () => {
  if (recoveryCartData && recoveryCartData.items) {
    // 1. Clear current cart
    clearCart();
    
    // 2. Restore items dengan cara yang lebih efisien
    //    (Daripada panggil addItem berkali-kali)
    useCartStore.setState({
      items: recoveryCartData.items,
      discount: recoveryCartData.discount || 0,
      // Jangan restore history karena itu history sesi lama
    });
    
    // 3. Hapus backup
    localStorage.removeItem(CART_BACKUP_KEY);
    
    // 4. Tutup popup
    setShowRecoveryPopup(false);
    setRecoveryCartData(null);
  }
};

  const handleStartNew = () => {
  // 1. Hapus backup dari localStorage
  localStorage.removeItem(CART_BACKUP_KEY);
  
  // 2. Kosongkan cart store (INI YANG MISSING!)
  clearCart();  // ← Tambahkan ini!
  
  // 3. Reset UI state
  setShowRecoveryPopup(false);
  setRecoveryCartData(null);
};

  if (!showRecoveryPopup || !recoveryCartData) return null;

  const total = recoveryCartData.items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  const lastSaved = recoveryCartData.last_saved_at
    ? format(new Date(recoveryCartData.last_saved_at), 'dd MMM yyyy HH:mm', { locale: id })
    : '';

  return (
    <Dialog
      open={showRecoveryPopup}
      onClose={() => {}} // blocking modal
      className="fixed inset-0 z-50 overflow-y-auto"
    >
      {/* Overlay */}
      <div className="fixed inset-0 bg-black bg-black/50" aria-hidden="true" />

      {/* Modal container */}
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full p-6">
          <Dialog.Title className="text-lg font-bold mb-4">
            Keranjang Tersimpan
          </Dialog.Title>

          <p className="text-sm text-gray-600 mb-4">
            Kami menemukan keranjang belanja yang belum terselesaikan dari sesi sebelumnya.
            Apakah Anda ingin memulihkannya?
          </p>

          {lastSaved && (
            <p className="text-xs text-gray-400 mb-4">
              Terakhir diedit: {lastSaved}
            </p>
          )}

          <div className="bg-gray-50 rounded p-3 mb-4 max-h-40 overflow-y-auto">
            {recoveryCartData.items.map((item, index) => (
              <div key={item.id || index} className="flex justify-between text-sm mb-2">
                <span className="truncate flex-1">
                  {item.name} x{item.quantity}
                </span>
                <span className="ml-2 font-medium">
                  Rp {(item.price * item.quantity).toLocaleString('id-ID')}
                </span>
              </div>
            ))}
            <div className="border-t border-gray-200 pt-2 mt-2 flex justify-between font-bold">
              <span>Total</span>
              <span>Rp {total.toLocaleString('id-ID')}</span>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleStartNew}
              className="flex-1 py-2 px-4 rounded font-bold bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
            >
              🗑️ Mulai Baru
            </button>
            <button
              onClick={handleRestore}
              className="flex-1 py-2 px-4 rounded font-bold bg-green-500 text-white hover:bg-green-600 transition-colors"
            >
              ✅ Lanjutkan
            </button>
          </div>
        </div>
      </div>
    </Dialog>
  );
}