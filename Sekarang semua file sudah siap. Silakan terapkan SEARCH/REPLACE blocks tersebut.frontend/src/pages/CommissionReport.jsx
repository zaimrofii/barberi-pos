import React, { useState, useEffect } from 'react';
import { Search, Download, Calendar, User, X } from 'lucide-react';
import { format, subDays } from 'date-fns';
import { id } from 'date-fns/locale';
import { getCommissionReport } from '../services/barberService';
import useBarberStore from '../stores/barberStore';

export default function CommissionReport() {
  const { barbers, fetchBarbers } = useBarberStore();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState(format(subDays(new Date(), 30), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [selectedBarber, setSelectedBarber] = useState('');

  useEffect(() => {
    fetchBarbers();
  }, [fetchBarbers]);

  const fetchReport = async () => {
    setLoading(true);
    try {
      const params = {
        start_date: startDate,
        end_date: endDate,
        per_page: 100,
      };
      if (selectedBarber) {
        params.barber_id = selectedBarber;
      }
      const response = await getCommissionReport(params);
      setTransactions(response.data?.data || []);
    } catch (error) {
      console.error('Failed to fetch report:', error);
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [startDate, endDate, selectedBarber]);

  // Calculate commission per barber
  const commissionData = transactions.reduce((acc, t) => {
    const barberName = t.barber_name || 'Unknown';
    if (!acc[barberName]) {
      acc[barberName] = { totalSales: 0, count: 0 };
    }
    acc[barberName].totalSales += t.total || 0;
    acc[barberName].count += 1;
    return acc;
  }, {});

  const exportCSV = () => {
    const headers = ['Barber', 'Total Penjualan', 'Komisi (10%)', 'Jumlah Transaksi'];
    const rows = Object.entries(commissionData).map(([name, data]) => [
      name,
      data.totalSales,
      data.totalSales * 0.1,
      data.count,
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `commission-report-${startDate}-${endDate}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-4 md:p-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="font-bold text-xl">Laporan Komisi</h1>
        <button
          onClick={exportCSV}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition text-sm font-medium"
        >
          <Download size={16} />
          Export CSV
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tanggal Mulai
            </label>
            <div className="relative">
              <Calendar size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full pl-10 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tanggal Akhir
            </label>
            <div className="relative">
              <Calendar size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full pl-10 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Barber
            </label>
            <div className="relative">
              <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <select
                value={selectedBarber}
                onChange={(e) => setSelectedBarber(e.target.value)}
                className="w-full pl-10 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent appearance-none bg-white"
              >
                <option value="">Semua Barber</option>
                {barbers.map((barber) => (
                  <option key={barber.id} value={barber.id}>
                    {barber.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Loading */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : Object.keys(commissionData).length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-gray-500">
          <Search size={48} className="mb-3 text-gray-300" />
          <p className="font-semibold">Tidak ada data komisi</p>
          <p className="text-sm">Belum ada transaksi pada periode ini</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left py-3 px-4 font-medium text-gray-500">Barber</th>
                <th className="text-right py-3 px-4 font-medium text-gray-500">Total Penjualan</th>
                <th className="text-right py-3 px-4 font-medium text-gray-500">Komisi (10%)</th>
                <th className="text-right py-3 px-4 font-medium text-gray-500">Jumlah Transaksi</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(commissionData).map(([name, data]) => (
                <tr key={name} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4 font-medium">{name}</td>
                  <td className="py-3 px-4 text-right">
                    Rp {data.totalSales.toLocaleString('id-ID')}
                  </td>
                  <td className="py-3 px-4 text-right text-green-600 font-medium">
                    Rp {(data.totalSales * 0.1).toLocaleString('id-ID')}
                  </td>
                  <td className="py-3 px-4 text-right text-gray-500">{data.count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
