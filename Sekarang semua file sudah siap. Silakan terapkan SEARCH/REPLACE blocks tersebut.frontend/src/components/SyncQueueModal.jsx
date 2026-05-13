import React, { useState, useEffect } from 'react';
import { Dialog } from '@headlessui/react';
import { Cloud, CloudUpload, CheckCircle, XCircle, Loader2, X } from 'lucide-react';
import useUIStore from '../stores/uiStore';

const OFFLINE_QUEUE_KEY = 'pos_offline_queue';

export default function SyncQueueModal() {
  const { isSyncModalOpen, closeSyncModal, syncProgress, syncStatus, pendingCount, setPendingCount } = useUIStore();
  const [queue, setQueue] = useState([]);
  const [syncing, setSyncing] = useState(false);
  const [syncResults, setSyncResults] = useState({});

  // Load queue from localStorage
  const loadQueue = () => {
    try {
      const stored = localStorage.getItem(OFFLINE_QUEUE_KEY);
      if (stored) {
        const items = JSON.parse(stored);
        setQueue(items);
        setPendingCount(items.length);
      } else {
        setQueue([]);
        setPendingCount(0);
      }
    } catch (e) {
      console.error('Failed to load offline queue:', e);
      setQueue([]);
      setPendingCount(0);
    }
  };

  useEffect(() => {
    if (isSyncModalOpen) {
      loadQueue();
    }
  }, [isSyncModalOpen]);

  // Listen for queue changes
  useEffect(() => {
    const handleQueueChange = () => loadQueue();
    window.addEventListener('storage', handleQueueChange);
    window.addEventListener('pos:offline-save', handleQueueChange);
    window.addEventListener('pos:sync-complete', handleQueueChange);
    return () => {
      window.removeEventListener('storage', handleQueueChange);
      window.removeEventListener('pos:offline-save', handleQueueChange);
      window.removeEventListener('pos:sync-complete', handleQueueChange);
    };
  }, []);

  const handleSyncAll = async () => {
    setSyncing(true);
    setSyncResults({});
    const total = queue.length;
    let completed = 0;

    for (let i = 0; i < queue.length; i++) {
      const transaction = queue[i];
      const localId = transaction.local_id;

      // Update status to syncing
      setSyncResults(prev => ({ ...prev, [localId]: 'syncing' }));

      try {
        // Simulate API call - in real app would call checkout API
        await new Promise((resolve) => setTimeout(resolve, 1000));

        // Success
        setSyncResults(prev => ({ ...prev, [localId]: 'success' }));
        completed++;

        // Remove from queue
        const updatedQueue = queue.filter(t => t.local_id !== localId);
        localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(updatedQueue));
        setQueue(updatedQueue);
        setPendingCount(updatedQueue.length);

        // Dispatch progress event
        window.dispatchEvent(
          new CustomEvent('pos:sync-progress', {
            detail: { completed, total, localId, status: 'success' }
          })
        );
      } catch (error) {
        // Failed
        setSyncResults(prev => ({ ...prev, [localId]: 'failed' }));
        completed++;

        window.dispatchEvent(
          new CustomEvent('pos:sync-progress', {
            detail: { completed, total, localId, status: 'failed' }
          })
        );
      }
    }

    setSyncing(false);
    window.dispatchEvent(new CustomEvent('pos:sync-complete'));
    loadQueue();
  };

  const calculateTotal = (transaction) => {
    if (!transaction.items) return 0;
    return transaction.items.reduce((sum, item) => sum + (item.price || 0) * (item.quantity || 1), 0);
  };

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return '';
    try {
      return new Date(timestamp).toLocaleString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return '';
    }
  };

  const getStatusIcon = (localId) => {
    const status = syncResults[localId];
    if (status === 'syncing') return <Loader2 size={16} className="animate-spin text-blue-500" />;
    if (status === 'success') return <CheckCircle size={16} className="text-green-500" />;
    if (status === 'failed') return <XCircle size={16} className="text-red-500" />;
    return <Cloud size={16} className="text-yellow-500" />;
  };

  const getStatusText = (localId) => {
    const status = syncResults[localId];
    if (status === 'syncing') return 'Menyinkronkan...';
    if (status === 'success') return 'Berhasil';
    if (status === 'failed') return 'Gagal';
    return 'Menunggu';
  };

  if (!isSyncModalOpen) return null;

  return (
    <Dialog
      open={isSyncModalOpen}
      onClose={closeSyncModal}
      className="fixed inset-0 z-50 overflow-y-auto"
    >
      <div className="flex items-center justify-center min-h-screen">
        <Dialog.Overlay className="fixed inset-0 bg-black bg-opacity-50" />

        <div className="relative bg-white rounded-lg shadow-xl max-w-lg w-full mx-4 p-6">
          <div className="flex items-center justify-between mb-4">
            <Dialog.Title className="text-lg font-bold flex items-center gap-2">
              <CloudUpload size={20} className="text-green-600" />
              Sinkronisasi Antrian
            </Dialog.Title>
            <button
              onClick={closeSyncModal}
              className="p-1 hover:bg-gray-100 rounded"
            >
              <X size={20} />
            </button>
          </div>

          {queue.length === 0 ? (
            <div className="flex flex-col items-center py-8 text-gray-500">
              <CheckCircle size={48} className="mb-3 text-green-500" />
              <p className="font-semibold">Semua data tersinkronisasi</p>
              <p className="text-sm">Tidak ada antrian yang tertunda</p>
            </div>
          ) : (
            <>
              <p className="text-sm text-gray-600 mb-4">
                {queue.length} transaksi menunggu sinkronisasi
              </p>

              {/* Progress bar */}
              {syncing && (
                <div className="mb-4">
                  <div className="flex justify-between text-xs text-gray-500 mb-1">
                    <span>Progress sinkronisasi</span>
                    <span>{syncProgress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-green-500 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${syncProgress}%` }}
                    ></div>
                  </div>
                </div>
              )}

              {/* Transaction list */}
              <div className="space-y-2 max-h-60 overflow-y-auto mb-4">
                {queue.map((transaction, index) => {
                  const total = calculateTotal(transaction);
                  const itemCount = transaction.items ? transaction.items.length : 0;
                  const localId = transaction.local_id || `trans-${index}`;

                  return (
                    <div
                      key={localId}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {localId}
                        </p>
                        <p className="text-xs text-gray-500">
                          {itemCount} item • Rp {total.toLocaleString('id-ID')}
                        </p>
                        {transaction.created_at && (
                          <p className="text-xs text-gray-400">
                            {formatTimestamp(transaction.created_at)}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2 ml-2">
                        {getStatusIcon(localId)}
                        <span className="text-xs text-gray-500">
                          {getStatusText(localId)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              <button
                onClick={handleSyncAll}
                disabled={syncing}
                className={`w-full py-2 px-4 rounded font-bold transition-colors flex items-center justify-center gap-2 ${
                  syncing
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-green-500 text-white hover:bg-green-600'
                }`}
              >
                {syncing ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Menyinkronkan...
                  </>
                ) : (
                  <>
                    <CloudUpload size={16} />
                    Sync Sekarang
                  </>
                )}
              </button>
            </>
          )}

          <div className="mt-4 pt-4 border-t border-gray-200">
            <button
              onClick={closeSyncModal}
              className="w-full py-2 px-4 rounded font-bold bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
            >
              Tutup
            </button>
          </div>
        </div>
      </div>
    </Dialog>
  );
}
