import React from 'react';
import { WifiOff } from 'lucide-react';

/**
 * OfflineBanner - Banner peringatan mode offline
 * 
 * Filosofi: "User harus TAHU bahwa internet sedang bermasalah."
 * Transparansi adalah kunci kepercayaan.
 * 
 * Props:
 * @param {boolean} isOffline - Status offline (true = offline mode)
 * @param {string} position - Posisi banner (top | bottom) default 'top'
 * @param {function} onDismiss - Optional: fungsi untuk dismiss banner
 */
const OfflineBanner = ({ isOffline = false, position = 'top', onDismiss = null }) => {
  if (!isOffline) return null;

  const positionClasses = {
    top: 'top-0',
    bottom: 'bottom-0'
  };

  return (
    <div
      className={`
        fixed ${positionClasses[position]} left-0 right-0 
        bg-red-600 text-white py-2 px-4 
        flex items-center justify-between
        shadow-lg z-50
        animate-slide-down
      `}
      role="alert"
      aria-live="polite"
    >
      <div className="flex items-center gap-2 mx-auto">
        <WifiOff className="w-4 h-4" />
        <span className="text-sm font-medium">OFFLINE MODE</span>
        <span className="text-xs opacity-80 ml-2">
          • Transaksi akan disimpan & disinkronkan nanti
        </span>
      </div>
      {onDismiss && (
        <button
          onClick={onDismiss}
          className="text-white hover:text-gray-200 transition-colors"
          aria-label="Dismiss"
        >
          ✕
        </button>
      )}
    </div>
  );
};

// CSS animation untuk slide down
const style = document.createElement('style');
style.textContent = `
  @keyframes slideDown {
    from {
      transform: translateY(-100%);
      opacity: 0;
    }
    to {
      transform: translateY(0);
      opacity: 1;
    }
  }
  .animate-slide-down {
    animation: slideDown 0.3s ease-out;
  }
`;
if (!document.querySelector('#offline-banner-styles')) {
  style.id = 'offline-banner-styles';
  document.head.appendChild(style);
}

export default OfflineBanner;
