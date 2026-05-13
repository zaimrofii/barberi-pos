import { useEffect, useCallback } from 'react';
import useUIStore from '../stores/uiStore';

const OFFLINE_QUEUE_KEY = 'pos_offline_queue';
const MAX_RETRIES = 3;

export default function useOfflineSync() {
  const { setOnlineStatus, openSyncModal, setSyncProgress, setSyncStatus, setPendingCount } = useUIStore();

  const loadQueue = useCallback(() => {
    try {
      const stored = localStorage.getItem(OFFLINE_QUEUE_KEY);
      if (stored) {
        const items = JSON.parse(stored);
        setPendingCount(items.length);
        return items;
      }
      setPendingCount(0);
      return [];
    } catch (e) {
      console.error('Failed to load offline queue:', e);
      setPendingCount(0);
      return [];
    }
  }, [setPendingCount]);

  const processQueue = useCallback(async () => {
    const queue = loadQueue();
    if (queue.length === 0) return;

    setSyncStatus('syncing');
    setSyncProgress(0);
    window.dispatchEvent(new CustomEvent('pos:sync-start', { detail: { total: queue.length } }));

    let completed = 0;
    const total = queue.length;

    for (let i = 0; i < queue.length; i++) {
      const transaction = queue[i];
      const localId = transaction.local_id;

      try {
        // Simulate API call - in real app would call checkout API
        await new Promise((resolve) => setTimeout(resolve, 1000));

        // Success - remove from queue
        const updatedQueue = queue.filter(t => t.local_id !== localId);
        localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(updatedQueue));
        completed++;

        window.dispatchEvent(
          new CustomEvent('pos:sync-progress', {
            detail: { completed, total, localId, status: 'success' }
          })
        );
      } catch (error) {
        // Failed - increment retry count
        const retryCount = (transaction.retryCount || 0) + 1;
        if (retryCount >= MAX_RETRIES) {
          // Remove from queue after max retries
          const updatedQueue = queue.filter(t => t.local_id !== localId);
          localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(updatedQueue));
        } else {
          // Update retry count
          const updatedQueue = queue.map(t =>
            t.local_id === localId ? { ...t, retryCount } : t
          );
          localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(updatedQueue));
        }
        completed++;

        window.dispatchEvent(
          new CustomEvent('pos:sync-progress', {
            detail: { completed, total, localId, status: 'failed' }
          })
        );
      }

      const progress = Math.round((completed / total) * 100);
      setSyncProgress(progress);
    }

    setSyncStatus('idle');
    setSyncProgress(0);
    loadQueue();
    window.dispatchEvent(new CustomEvent('pos:sync-complete'));
  }, [loadQueue, setSyncProgress, setSyncStatus]);

  const handleOnline = useCallback(async () => {
    setOnlineStatus(true);
    const queue = loadQueue();
    if (queue.length > 0) {
      openSyncModal();
      await processQueue();
    }
  }, [setOnlineStatus, loadQueue, openSyncModal, processQueue]);

  const handleOffline = useCallback(() => {
    setOnlineStatus(false);
  }, [setOnlineStatus]);

  useEffect(() => {
    // Set initial online status
    setOnlineStatus(navigator.onLine);

    // Load initial queue count
    loadQueue();

    // Listen for online/offline events
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Listen for custom events
    const handleOfflineSave = () => {
      loadQueue();
    };

    window.addEventListener('pos:offline-save', handleOfflineSave);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('pos:offline-save', handleOfflineSave);
    };
  }, []);

  return {
    loadQueue,
    processQueue,
  };
}
