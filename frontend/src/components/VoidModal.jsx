import React, { useState } from 'react';
import { Dialog } from '@headlessui/react';
import { X, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';
import ConfirmModal from './ConfirmModal';
import { voidTransaction } from '../services/barberService';

const VOID_REASONS = [
  'Customer cancelled',
  'Wrong item',
  'Duplicate transaction',
  'Other',
];

export default function VoidModal({ isOpen, onClose, transaction, onVoidSuccess }) {
  const [reason, setReason] = useState('');
  const [customReason, setCustomReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);

  const handleSubmit = async () => {
    const finalReason = reason === 'Other' ? customReason : reason;
    if (!finalReason.trim()) {
      toast.error('Alasan void harus diisi');
      return;
    }

    setConfirmModalOpen(true);
  };

  const handleConfirmVoid = async () => {
    const finalReason = reason === 'Other' ? customReason : reason;
    setLoading(true);
    try {
      await voidTransaction(transaction.id, finalReason);
      toast.success('Transaksi berhasil di-void');
      onVoidSuccess();
      onClose();
    } catch (error) {
      toast.error('Gagal void transaksi: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
      setConfirmModalOpen(false);
    }
  };

  if (!transaction) return null;

  return (
    <>
      <ConfirmModal
        isOpen={confirmModalOpen}
        onClose={() => setConfirmModalOpen(false)}
        onConfirm={handleConfirmVoid}
        title="Konfirmasi Void"
        message={`Apakah Anda yakin ingin void transaksi ${transaction.id}?`}
        confirmText="Ya, Void"
        cancelText="Batal"
        confirmVariant="danger"
      />
    <Dialog
      open={isOpen}
      onClose={onClose}
      className="fixed inset-0 z-50 overflow-y-auto"
    >
      <div className="flex items-center justify-center min-h-screen">
        <Dialog.Overlay className="fixed inset-0 bg-black bg-opacity-50" />

        <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
          <div className="flex items-center justify-between mb-4">
            <Dialog.Title className="text-lg font-bold flex items-center gap-2">
              <AlertTriangle size={20} className="text-red-500" />
              Void Transaksi
            </Dialog.Title>
            <button
              onClick={onClose}
              className="p-1 hover:bg-gray-100 rounded"
            >
              <X size={20} />
            </button>
          </div>

          <div className="space-y-4">
            {/* Transaction info */}
            <div className="bg-gray-50 rounded-lg p-3 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">ID Transaksi</span>
                <span className="font-medium">{transaction.id}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Total</span>
                <span className="font-medium">
                  Rp {transaction.total?.toLocaleString('id-ID') || 0}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Tanggal</span>
                <span className="font-medium">
                  {new Date(transaction.created_at).toLocaleString('id-ID')}
                </span>
              </div>
            </div>

            {/* Reason selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Alasan Void <span className="text-red-500">*</span>
              </label>
              <div className="space-y-2">
                {VOID_REASONS.map((r) => (
                  <label key={r} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="voidReason"
                      value={r}
                      checked={reason === r}
                      onChange={(e) => setReason(e.target.value)}
                      className="text-green-600 focus:ring-green-500"
                    />
                    <span className="text-sm">{r}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Custom reason textarea */}
            {reason === 'Other' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Alasan lainnya
                </label>
                <textarea
                  value={customReason}
                  onChange={(e) => setCustomReason(e.target.value)}
                  rows={3}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Tuliskan alasan void..."
                />
              </div>
            )}
          </div>

          <div className="flex gap-3 mt-6">
            <button
              onClick={onClose}
              className="flex-1 py-2 px-4 rounded font-bold bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
            >
              Batal
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading || !reason}
              className={`flex-1 py-2 px-4 rounded font-bold transition-colors ${
                loading || !reason
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-red-500 text-white hover:bg-red-600'
              }`}
            >
              {loading ? 'Memproses...' : 'Void Transaksi'}
            </button>
          </div>
        </div>
      </div>
    </Dialog>
    </>
  );
}
