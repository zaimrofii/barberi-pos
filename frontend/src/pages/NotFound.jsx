import React from 'react';
import { Link } from 'react-router-dom';
import { Home, AlertCircle } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="text-center">
        <div className="flex justify-center mb-6">
          <AlertCircle size={80} className="text-error" />
        </div>
        <h1 className="text-4xl font-bold text-primary mb-2">404</h1>
        <h2 className="text-xl font-semibold text-gray-700 mb-4">Halaman Tidak Ditemukan</h2>
        <p className="text-gray-500 mb-8">
          Maaf, halaman yang Anda cari tidak tersedia.
        </p>
        <Link
          to="/pos"
          className="inline-flex items-center gap-2 px-6 py-3 bg-success text-primary font-semibold rounded-lg hover:bg-success-dark transition"
        >
          <Home size={18} />
          Kembali ke POS
        </Link>
      </div>
    </div>
  );
}
