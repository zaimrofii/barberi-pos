import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, X, AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import VoidModal from '../components/VoidModal';
import { getCommissionReport } from '../services/barberService';

export default function History() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [voidModalOpen, setVoidModalOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState(null);

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const response = await getCommissionReport({ per_page: 50 });
      setTransactions(response.data?.data || []);
    } catch (error) {
      console.error('Failed to fetch transactions:', error);
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  const handleVoidClick = (transaction) => {
    setSelectedTransaction(transaction);
    setVoidModalOpen(true);
  };

  const handleVoidSuccess = () => {
    fetchTransactions();
  };

  const filteredTransactions = transactions.filter((t) =>
    t.id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.barber_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusBadge = (status) => {
    switch (status) {
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1 bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full">
            <CheckCircle size={12} />
            Completed
          </span>
        );
      case 'voided':
        return (
          <span className="inline-flex items-center gap-1 bg-red-100 text-red-700 text-xs px-2 py-0.5 rounded-full">
            <AlertTriangle size={12} />
            Voided
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 bg-yellow-100 text-yellow-700 text-xs px-2 py-0.5 rounded-full">
            <Clock size={12} />
            Pending
          </span>
        );
    }
  };

  return (
    <div className="p-4 md:p-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="font-bold text-xl">Riwayat Transaksi</h1>
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari transaksi..."
            className="w-64 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent"
          />
          <Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filteredTransactions.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-gray-500">
          <Search size={48} className="mb-3 text-gray-300" />
          <p className="font-semibold">Tidak ada transaksi</p>
          <p className="text-sm">Belum ada transaksi yang tercatat</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-medium text-gray-500">ID</th>
                <th className="text-left py-3 px-4 font-medium text-gray-500">Barber</th>
                <th className="text-left py-3 px-4 font-medium text-gray-500">Total</th>
                <th className="text-left py-3 px-4 font-medium text-gray-500">Status</th>
                <th className="text-left py-3 px-4 font-medium text-gray-500">Tanggal</th>
                <th className="text-right py-3 px-4 font-medium text-gray-500">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filteredTransactions.map((transaction) => (
                <tr key={transaction.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4 font-mono text-xs">{transaction.id?.slice(0, 8)}...</td>
                  <td className="py-3 px-4">{transaction.barber_name || '-'}</td>
                  <td className="py-3 px-4 font-medium">
                    Rp {transaction.total?.toLocaleString('id-ID') || 0}
                  </td>
                  <td className="py-3 px-4">{getStatusBadge(transaction.status)}</td>
                  <td className="py-3 px-4 text-gray-500">
                    {new Date(transaction.created_at).toLocaleDateString('id-ID')}
                  </td>
                  <td className="py-3 px-4 text-right">
                    {transaction.status !== 'voided' && (
                      <button
                        onClick={() => handleVoidClick(transaction)}
                        className="text-red-500 hover:text-red-700 text-xs font-medium"
                      >
                        Void
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <VoidModal
        isOpen={voidModalOpen}
        onClose={() => {
          setVoidModalOpen(false);
          setSelectedTransaction(null);
        }}
        transaction={selectedTransaction}
        onVoidSuccess={handleVoidSuccess}
      />
    </div>
  );
}
