import React, { useState, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  BarChart3,
  TrendingUp,
  Users,
  Calendar,
  Download,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Search,
  Filter,
  ArrowUpDown,
  Eye,
  Receipt,
  User,
  Scissors,
  Package,
} from 'lucide-react';
import { format, subDays, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';
import { id } from 'date-fns/locale';
import useBarberStore from '../stores/barberStore';
import useUIStore from '../stores/uiStore';
import LoadingSpinner from '../components/LoadingSpinner';

// Mock data - will be replaced with API call
const mockCommissionData = [
  { id: 1, barberId: 1, barberName: 'Budi Santoso', transactionCount: 45, totalSales: 8750000, commission: 437500, commissionRate: 5, date: '2026-05-15' },
  { id: 2, barberId: 2, barberName: 'Siti Rahayu', transactionCount: 38, totalSales: 7200000, commission: 360000, commissionRate: 5, date: '2026-05-15' },
  { id: 3, barberId: 3, barberName: 'Ahmad Fauzi', transactionCount: 52, totalSales: 12400000, commission: 620000, commissionRate: 5, date: '2026-05-15' },
  { id: 4, barberId: 4, barberName: 'Dewi Kartika', transactionCount: 29, totalSales: 5600000, commission: 280000, commissionRate: 5, date: '2026-05-15' },
  { id: 5, barberId: 5, barberName: 'Rizki Pratama', transactionCount: 41, totalSales: 9800000, commission: 490000, commissionRate: 5, date: '2026-05-15' },
];

// Summary Card Component
function SummaryCard({ title, value, icon: Icon, color, trend, trendValue }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500 mb-1">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          {trend && (
            <div className="flex items-center gap-1 mt-2">
              <span className={`text-xs ${trend > 0 ? 'text-success' : 'text-error'}`}>
                {trend > 0 ? '+' : ''}{trend}%
              </span>
              <span className="text-xs text-gray-400">dari periode sebelumnya</span>
            </div>
          )}
        </div>
        <div className={`p-3 rounded-xl ${color}`}>
          <Icon size={24} className="text-white" />
        </div>
      </div>
    </div>
  );
}

// Date Range Picker Component
function DateRangePicker({ startDate, endDate, onStartDateChange, onEndDateChange, onPreset }) {
  const presets = [
    { label: 'Hari Ini', days: 0 },
    { label: 'Kemarin', days: 1 },
    { label: '7 Hari', days: 7 },
    { label: '30 Hari', days: 30 },
    { label: 'Bulan Ini', type: 'month' },
  ];

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="flex items-center gap-2 bg-gray-50 rounded-lg p-1">
        {presets.map((preset) => (
          <button
            key={preset.label}
            onClick={() => onPreset(preset)}
            className="px-3 py-1.5 text-sm rounded-md transition hover:bg-white hover:shadow-sm"
          >
            {preset.label}
          </button>
        ))}
      </div>
      <div className="flex items-center gap-2">
        <div className="relative">
          <input
            type="date"
            value={startDate}
            onChange={(e) => onStartDateChange(e.target.value)}
            className="pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent"
          />
          <Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        </div>
        <span className="text-gray-400">—</span>
        <div className="relative">
          <input
            type="date"
            value={endDate}
            onChange={(e) => onEndDateChange(e.target.value)}
            className="pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent"
          />
          <Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        </div>
      </div>
    </div>
  );
}

// Commission Table Row Component
function CommissionRow({ data, index, onViewDetails }) {
  const getRankClass = (idx) => {
    if (idx === 0) return 'bg-yellow-50 border-yellow-200';
    if (idx === 1) return 'bg-gray-50 border-gray-200';
    if (idx === 2) return 'bg-orange-50 border-orange-200';
    return '';
  };

  const getRankIcon = (idx) => {
    if (idx === 0) return '🥇';
    if (idx === 1) return '🥈';
    if (idx === 2) return '🥉';
    return `${idx + 1}`;
  };

  return (
    <tr className={`border-b border-gray-100 hover:bg-gray-50 transition ${getRankClass(index)}`}>
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
            {index < 3 ? (
              <span className="text-lg">{getRankIcon(index)}</span>
            ) : (
              <User size={14} className="text-primary" />
            )}
          </div>
          <span className="font-medium text-gray-800">{data.barberName}</span>
        </div>
      </td>
      <td className="px-4 py-3 text-center">
        <div className="flex items-center justify-center gap-1">
          <Scissors size={12} className="text-gray-400" />
          <span>{data.transactionCount}</span>
        </div>
      </td>
      <td className="px-4 py-3 text-right font-medium">
        Rp {data.totalSales.toLocaleString('id-ID')}
      </td>
      <td className="px-4 py-3 text-right">
        <span className="text-xs text-gray-500 mr-1">{data.commissionRate}%</span>
        <span className="font-semibold text-success">
          Rp {data.commission.toLocaleString('id-ID')}
        </span>
      </td>
      <td className="px-4 py-3 text-center">
        <button
          onClick={() => onViewDetails(data)}
          className="p-1.5 text-gray-400 hover:text-accent transition"
          title="Lihat detail"
        >
          <Eye size={16} />
        </button>
      </td>
    </tr>
  );
}

// Main Component
export default function CommissionReport() {
  const { barbers } = useBarberStore();
  const { isOnline } = useUIStore();
  
  const [loading, setLoading] = useState(false);
  const [commissionData, setCommissionData] = useState(mockCommissionData);
  const [startDate, setStartDate] = useState(format(subDays(new Date(), 30), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('commission');
  const [sortOrder, setSortOrder] = useState('desc');
  const [selectedBarber, setSelectedBarber] = useState('all');
  const [viewMode, setViewMode] = useState('table'); // 'table', 'chart'

  // Filter and sort data
  const filteredData = useMemo(() => {
    let filtered = [...commissionData];
    
    // Filter by barber
    if (selectedBarber !== 'all') {
      filtered = filtered.filter((item) => item.barberId === parseInt(selectedBarber));
    }
    
    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter((item) =>
        item.barberName.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Sort data
    filtered.sort((a, b) => {
      let comparison = 0;
      if (sortBy === 'commission') comparison = a.commission - b.commission;
      if (sortBy === 'totalSales') comparison = a.totalSales - b.totalSales;
      if (sortBy === 'transactionCount') comparison = a.transactionCount - b.transactionCount;
      if (sortBy === 'barberName') comparison = a.barberName.localeCompare(b.barberName);
      return sortOrder === 'desc' ? -comparison : comparison;
    });
    
    return filtered;
  }, [commissionData, searchTerm, sortBy, sortOrder, selectedBarber]);

  // Summary statistics
  const summary = useMemo(() => {
    const totalCommission = filteredData.reduce((sum, item) => sum + item.commission, 0);
    const totalSales = filteredData.reduce((sum, item) => sum + item.totalSales, 0);
    const totalTransactions = filteredData.reduce((sum, item) => sum + item.transactionCount, 0);
    const avgCommissionRate = filteredData.length > 0 
      ? (totalCommission / totalSales) * 100 
      : 0;
    
    return {
      totalCommission,
      totalSales,
      totalTransactions,
      avgCommissionRate,
      barberCount: filteredData.length,
    };
  }, [filteredData]);

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  const handleDatePreset = (preset) => {
    const today = new Date();
    if (preset.type === 'month') {
      setStartDate(format(startOfMonth(today), 'yyyy-MM-dd'));
      setEndDate(format(endOfMonth(today), 'yyyy-MM-dd'));
    } else if (preset.days === 0) {
      setStartDate(format(today, 'yyyy-MM-dd'));
      setEndDate(format(today, 'yyyy-MM-dd'));
    } else {
      setStartDate(format(subDays(today, preset.days), 'yyyy-MM-dd'));
      setEndDate(format(today, 'yyyy-MM-dd'));
    }
  };

  const handleExport = () => {
    const csvData = filteredData.map((item) => ({
      'Nama Barber': item.barberName,
      'Jumlah Transaksi': item.transactionCount,
      'Total Penjualan': item.totalSales,
      'Rate Komisi': `${item.commissionRate}%`,
      'Komisi': item.commission,
    }));
    
    const csv = [
      Object.keys(csvData[0]).join(','),
      ...csvData.map((row) => Object.values(row).join(',')),
    ].join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `commission_report_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    
    toast.success('Laporan berhasil diekspor');
  };

  const handleRefresh = async () => {
    setLoading(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setLoading(false);
    toast.success('Data berhasil diperbarui');
  };

  const handleViewDetails = (barber) => {
    toast.success(`Detail komisi ${barber.barberName} akan segera tersedia`);
  };

  const SortableHeader = ({ field, label }) => (
    <button
      onClick={() => handleSort(field)}
      className="flex items-center gap-1 hover:text-accent transition"
    >
      {label}
      <ArrowUpDown size={14} className={sortBy === field ? 'text-accent' : 'text-gray-400'} />
    </button>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-primary text-white sticky top-0 z-10 shadow-lg">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold">Laporan Komisi</h1>
              <p className="text-sm text-primary-light mt-1">
                {format(new Date(startDate), 'dd MMM yyyy', { locale: id })} - {format(new Date(endDate), 'dd MMM yyyy', { locale: id })}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Link
                to="/pos"
                className="flex items-center gap-2 px-4 py-2 bg-primary-light rounded-lg hover:bg-primary-dark transition"
              >
                <ChevronLeft size={18} />
                Kembali ke POS
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="p-6">
        {/* Filter Bar */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <DateRangePicker
              startDate={startDate}
              endDate={endDate}
              onStartDateChange={setStartDate}
              onEndDateChange={setEndDate}
              onPreset={handleDatePreset}
            />
            
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Cari barber..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm w-48 focus:outline-none focus:ring-2 focus:ring-accent"
                />
              </div>
              
              <select
                value={selectedBarber}
                onChange={(e) => setSelectedBarber(e.target.value)}
                className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent"
              >
                <option value="all">Semua Barber</option>
                {barbers.map((barber) => (
                  <option key={barber.id} value={barber.id}>
                    {barber.name}
                  </option>
                ))}
              </select>
              
              <button
                onClick={handleRefresh}
                className="p-2 text-gray-500 hover:text-accent transition"
                title="Refresh data"
              >
                <RefreshCw size={18} />
              </button>
              
              <button
                onClick={handleExport}
                className="flex items-center gap-2 px-4 py-2 bg-success text-primary font-semibold rounded-lg hover:bg-success-dark transition"
              >
                <Download size={16} />
                Ekspor CSV
              </button>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-6">
          <SummaryCard
            title="Total Komisi"
            value={`Rp ${summary.totalCommission.toLocaleString('id-ID')}`}
            icon={TrendingUp}
            color="bg-success"
            trend={12.5}
          />
          <SummaryCard
            title="Total Penjualan"
            value={`Rp ${summary.totalSales.toLocaleString('id-ID')}`}
            icon={BarChart3}
            color="bg-accent"
            trend={8.3}
          />
          <SummaryCard
            title="Total Transaksi"
            value={summary.totalTransactions.toLocaleString('id-ID')}
            icon={Receipt}
            color="bg-primary"
            trend={5.2}
          />
          <SummaryCard
            title="Rata-rata Komisi"
            value={`${summary.avgCommissionRate.toFixed(1)}%`}
            icon={Users}
            color="bg-warning"
            trend={-2.1}
          />
        </div>

        {/* Commission Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">
                    <SortableHeader field="barberName" label="Barber" />
                  </th>
                  <th className="px-4 py-3 text-center text-sm font-semibold text-gray-600">
                    <SortableHeader field="transactionCount" label="Transaksi" />
                  </th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-gray-600">
                    <SortableHeader field="totalSales" label="Total Penjualan" />
                  </th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-gray-600">
                    <SortableHeader field="commission" label="Komisi" />
                  </th>
                  <th className="px-4 py-3 text-center text-sm font-semibold text-gray-600">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredData.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-4 py-12 text-center text-gray-400">
                      <div className="flex flex-col items-center gap-2">
                        <BarChart3 size={40} />
                        <p>Tidak ada data untuk periode yang dipilih</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredData.map((data, idx) => (
                    <CommissionRow
                      key={data.id}
                      data={data}
                      index={idx}
                      onViewDetails={handleViewDetails}
                    />
                  ))
                )}
              </tbody>
            </table>
          </div>
          
          {/* Footer */}
          <div className="border-t border-gray-100 px-4 py-3 bg-gray-50 flex items-center justify-between text-sm text-gray-500">
            <div>
              Menampilkan {filteredData.length} dari {commissionData.length} barber
            </div>
            <div className="flex items-center gap-2">
              <button className="p-1 hover:text-accent transition disabled:opacity-50" disabled>
                <ChevronLeft size={16} />
              </button>
              <span className="px-2 py-1 bg-white rounded border">1</span>
              <button className="p-1 hover:text-accent transition disabled:opacity-50" disabled>
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>
        
        {/* Offline indicator */}
        {!isOnline && (
          <div className="mt-4 text-center text-sm text-warning">
            ⚠️ Mode offline - Data mungkin tidak terbaru
          </div>
        )}
      </div>
    </div>
  );
}