import { useEffect, useRef } from 'react';
import useCartStore from '../stores/cartStore';
import useUIStore from '../stores/uiStore';
import { CART_BACKUP_KEY, AUTO_SAVE_INTERVAL_MS } from '../utils/constants';

export default function useAutoSave() {
  const { items, discount } = useCartStore();
  const { setLastSaveTime, setSaveStatus } = useUIStore();
  const prevSnapshot = useRef(null);

  useEffect(() => {
    const interval = setInterval(() => {
      const currentSnapshot = JSON.stringify({ items, discount });
      if (currentSnapshot !== prevSnapshot.current) {
        try {
          setSaveStatus('saving');
          const backupData = {
            items,
            discount,
            last_saved_at: new Date().toISOString(),
          };
          localStorage.setItem(CART_BACKUP_KEY, JSON.stringify(backupData));
          prevSnapshot.current = currentSnapshot;

          const now = new Date().toISOString();
          setLastSaveTime(now);
          setSaveStatus('saved');

          // Dispatch custom event
          window.dispatchEvent(
            new CustomEvent('pos:auto-save', { detail: { ...backupData, status: 'saved' } })
          );
        } catch (e) {
          console.error('Auto-save failed:', e);
          setSaveStatus('error');
          window.dispatchEvent(
            new CustomEvent('pos:auto-save', { detail: { status: 'error', error: e.message } })
          );
        }
      }
    }, AUTO_SAVE_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [items, discount, setLastSaveTime, setSaveStatus]);
}
