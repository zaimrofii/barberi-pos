import React, { useState, useEffect } from 'react';
import { Keyboard, Search, CreditCard, Tag, Package, Trash2, Undo, X } from 'lucide-react';
import toast from 'react-hot-toast';

const SHORTCUTS = [
  { key: 'F1', icon: Search, label: 'Cari produk', description: 'Fokus ke kolom pencarian' },
  { key: 'F2', icon: CreditCard, label: 'Bayar', description: 'Proses checkout/pembayaran' },
  { key: 'F3', icon: Tag, label: 'Diskon', description: 'Buka modal diskon' },
  { key: 'F4', icon: Package, label: 'Pilih cepat', description: 'Buka daftar produk populer' },
  { key: 'ESC', icon: Trash2, label: 'Hapus', description: 'Kosongkan keranjang (dengan konfirmasi)' },
  { key: 'Ctrl+Z', icon: Undo, label: 'Undo', description: 'Batalkan aksi terakhir' },
  { key: '+/-', icon: null, label: 'Qty', description: 'Atur jumlah item (NumPad)' },
];

export default function ShortcutsHelper() {
  const [visible, setVisible] = useState(true);
  const [hoveredShortcut, setHoveredShortcut] = useState(null);
  const [pulseKey, setPulseKey] = useState(null);

  // Listen for shortcut triggers to show pulse animation
  useEffect(() => {
    const handleKeyDown = (e) => {
      let key = '';
      if (e.key === 'F1') key = 'F1';
      else if (e.key === 'F2') key = 'F2';
      else if (e.key === 'F3') key = 'F3';
      else if (e.key === 'F4') key = 'F4';
      else if (e.key === 'Escape') key = 'ESC';
      else if ((e.ctrlKey || e.metaKey) && e.key === 'z') key = 'Ctrl+Z';
      else if (e.key === '+' || e.key === 'Add') key = '+/-';
      else if (e.key === '-' || e.key === 'Subtract') key = '+/-';

      if (key) {
        setPulseKey(key);
        setTimeout(() => setPulseKey(null), 500);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  if (!visible) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 hidden md:block">
      <div className="relative group">
        {/* Toggle button */}
        <button
          onClick={() => setVisible(false)}
          className="absolute -top-2 -right-2 bg-gray-800 text-white rounded-full p-0.5 hover:bg-gray-700 transition z-10"
          title="Sembunyikan shortcut"
        >
          <X size={12} />
        </button>

        {/* Main toolbar */}
        <div className="bg-gray-900/90 backdrop-blur-sm rounded-full shadow-lg px-4 py-2 flex items-center gap-2">
          <Keyboard size={16} className="text-gray-400 mr-1" />

          {SHORTCUTS.map((shortcut) => {
            const Icon = shortcut.icon;
            const isPulsing = pulseKey === shortcut.key;

            return (
              <div
                key={shortcut.key}
                className="relative"
                onMouseEnter={() => setHoveredShortcut(shortcut.key)}
                onMouseLeave={() => setHoveredShortcut(null)}
              >
                <div
                  className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium transition-all cursor-default ${
                    isPulsing
                      ? 'bg-green-500 text-white scale-110'
                      : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                  }`}
                >
                  {Icon && <Icon size={12} />}
                  <span>{shortcut.key}</span>
                </div>

                {/* Tooltip */}
                {hoveredShortcut === shortcut.key && (
                  <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs rounded-lg px-3 py-2 shadow-lg whitespace-nowrap z-50">
                    <p className="font-semibold">{shortcut.label}</p>
                    <p className="text-gray-400">{shortcut.description}</p>
                    <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
