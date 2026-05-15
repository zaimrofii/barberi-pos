import React from 'react';
import { Dialog } from '@headlessui/react';
import { X, AlertTriangle } from 'lucide-react';

export default function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title = 'Konfirmasi',
  message = 'Apakah Anda yakin?',
  confirmText = 'Ya',
  cancelText = 'Batal',
  confirmVariant = 'danger', // 'danger' | 'primary'
}) {
  return (
    <Dialog
      open={isOpen}
      onClose={onClose}
      className="fixed inset-0 z-50 overflow-y-auto"
    >
      <div className="flex items-center justify-center min-h-screen">
        <Dialog.Overlay className="fixed inset-0 bg-black bg-opacity-50" />

        <div className="relative bg-white rounded-lg shadow-xl max-w-sm w-full mx-4 p-6">
          <div className="flex items-center justify-between mb-4">
            <Dialog.Title className="text-lg font-bold flex items-center gap-2">
              <AlertTriangle size={20} className={confirmVariant === 'danger' ? 'text-error' : 'text-success'} />
              {title}
            </Dialog.Title>
            <button
              onClick={onClose}
              className="p-1 hover:bg-gray-100 rounded"
            >
              <X size={20} />
            </button>
          </div>

          <p className="text-sm text-gray-600 mb-6">{message}</p>

          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 py-2 px-4 rounded font-bold bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
            >
              {cancelText}
            </button>
            <button
              onClick={() => {
                onConfirm();
                onClose();
              }}
              className={`flex-1 py-2 px-4 rounded font-bold transition-colors ${
                confirmVariant === 'danger'
                  ? 'bg-error text-white hover:bg-error-dark'
                  : 'bg-success text-white hover:bg-success-dark'
              }`}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </Dialog>
  );
}
