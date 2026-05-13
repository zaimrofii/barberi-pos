import React from 'react';
import { ShoppingCart, Search, User, CloudUpload } from 'lucide-react';
import useUIStore from '../stores/uiStore';

export default function Header({
  kasirName = 'Kasir',
  cartItemCount = 0,
  cartTotal = 0,
  onCheckout = () => {},
  onSearch = () => {},
  searchValue = '',
  onToggleCart = () => {},
  isMobile = false,
}) {
  const { pendingCount, openSyncModal } = useUIStore();

  return (
    <header className="bg-gray-900 text-white px-4 py-3">
      <div className="flex items-center justify-between gap-4">
        <div className="flex-shrink-0">
          <h1 className="font-bold text-lg">BarberPOS</h1>
        </div>

        {!isMobile && (
          <div className="flex-1 max-w-md">
            <div className="relative flex items-center">
              <input
                type="text"
                data-search-input
                value={searchValue}
                onChange={(e) => onSearch(e.target.value)}
                placeholder="Cari produk... (F1)"
                className="w-full bg-gray-800 text-white px-4 py-2 rounded-lg placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500"
              />
              <Search size={18} className="absolute right-3 text-gray-400 pointer-events-none" />
            </div>
          </div>
        )}

        <div className="flex items-center gap-4">
          {/* Sync button */}
          <button
            onClick={openSyncModal}
            className="relative p-1 hover:bg-gray-800 rounded transition"
            title="Antrian sinkronisasi"
          >
            <CloudUpload size={20} className="text-gray-300" />
            {pendingCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-yellow-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                {pendingCount}
              </span>
            )}
          </button>

          <div className="flex items-center gap-2 text-sm">
            <User size={16} />
            {kasirName}
          </div>

          <button
            onClick={onToggleCart}
            className="relative p-1 hover:bg-gray-800 rounded"
          >
            <ShoppingCart size={24} />
            {cartItemCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-green-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                {cartItemCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
