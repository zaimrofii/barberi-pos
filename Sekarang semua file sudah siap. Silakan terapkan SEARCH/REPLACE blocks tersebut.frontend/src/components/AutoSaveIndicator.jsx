import React, { useState, useEffect } from 'react';
import { Cloud, CloudOff, CheckCircle2, Loader2, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import useUIStore from '../stores/uiStore';

export default function AutoSaveIndicator() {
  const { lastSaveTime, saveStatus } = useUIStore();
  const [visible, setVisible] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);

  useEffect(() => {
    if (saveStatus === 'saving') {
      setVisible(true);
    } else if (saveStatus === 'saved' || saveStatus === 'error') {
      setVisible(true);
      const timer = setTimeout(() => {
        setVisible(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [saveStatus]);

  if (!visible) return null;

  const getIcon = () => {
    switch (saveStatus) {
      case 'saving':
        return <Loader2 size={16} className="animate-spin text-blue-400" />;
      case 'saved':
        return <CheckCircle2 size={16} className="text-green-400" />;
      case 'error':
        return <AlertCircle size={16} className="text-red-400" />;
      default:
        return <Cloud size={16} className="text-gray-400" />;
    }
  };

  const getText = () => {
    switch (saveStatus) {
      case 'saving':
        return 'Menyimpan...';
      case 'saved':
        return 'Tersimpan';
      case 'error':
        return 'Gagal menyimpan';
      default:
        return '';
    }
  };

  const formattedTime = lastSaveTime
    ? format(new Date(lastSaveTime), 'HH:mm:ss', { locale: id })
    : '';

  return (
    <div
      className="fixed bottom-4 left-4 z-50"
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      <div className="flex items-center gap-2 bg-gray-900/90 backdrop-blur-sm rounded-full px-3 py-1.5 shadow-lg">
        {getIcon()}
        <span className="text-xs text-gray-300">{getText()}</span>
      </div>

      {/* Tooltip */}
      {showTooltip && saveStatus === 'saved' && (
        <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs rounded-lg px-3 py-2 shadow-lg whitespace-nowrap z-50">
          <p>Tersimpan otomatis • {formattedTime}</p>
          <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
        </div>
      )}
    </div>
  );
}
