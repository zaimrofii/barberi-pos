import React from 'react'
import { Dialog } from '@headlessui/react'
import { X, CloudUpload, CheckCircle2, AlertTriangle } from 'lucide-react'
import useUIStore from '../stores/uiStore'

export default function SyncQueueModal() {
  const { isSyncModalOpen, closeSyncModal, syncProgress, syncStatus, pendingCount } = useUIStore()

  return (
    <Dialog
      open={isSyncModalOpen}
      onClose={closeSyncModal}
      className="fixed inset-0 z-50 overflow-y-auto"
    >
      <div className="flex items-center justify-center min-h-screen">
        <Dialog.Overlay className="fixed inset-0 bg-black bg-opacity-50" />
        <div className="relative bg-white rounded-lg shadow-xl max-w-sm w-full mx-4 p-6">

          <div className="flex items-center justify-between mb-4">
            <Dialog.Title className="text-lg font-bold flex items-center gap-2">
              <CloudUpload size={20} className="text-amber-500" />
              Sinkronisasi Offline
            </Dialog.Title>
            <button onClick={closeSyncModal} className="p-1 hover:bg-gray-100 rounded">
              <X size={20} />
            </button>
          </div>

          {pendingCount === 0 ? (
            <div className="flex flex-col items-center py-6">
              <CheckCircle2 size={40} className="text-success mb-2" />
              <p className="text-gray-600 font-medium">Semua transaksi tersinkronisasi</p>
            </div>
          ) : (
            <div>
              <p className="text-gray-600 text-sm mb-4">
                {pendingCount} transaksi menunggu sinkronisasi
              </p>
              {syncStatus === 'syncing' && (
                <div className="mb-4">
                  <div className="flex justify-between text-xs text-gray-500 mb-1">
                    <span>Progres</span>
                    <span>{syncProgress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-success h-2 rounded-full transition-all"
                      style={{ width: `${syncProgress}%` }}
                    />
                  </div>
                </div>
              )}
              <div className="flex items-center gap-2 text-amber-600 text-sm bg-amber-50 px-3 py-2 rounded-lg">
                <AlertTriangle size={14} />
                Data akan dikirim saat terhubung internet
              </div>
            </div>
          )}

          <button
            onClick={closeSyncModal}
            className="w-full mt-4 py-2 px-4 rounded font-bold bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
          >
            Tutup
          </button>

        </div>
      </div>
    </Dialog>
  )
}
