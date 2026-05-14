import React from 'react';

/**
 * LoadingSpinner - Komponen animasi loading minimal
 * 
 * Filosofi: "Jangan biarkan user diam tanpa feedback."
 * Komponen ini muncul saat aplikasi sedang memuat data.
 * 
 * Props:
 * @param {string} size - Ukuran spinner (sm | md | lg) default 'md'
 * @param {string} color - Warna spinner (default 'blue')
 * @param {string} className - Tambahan class CSS
 */
const LoadingSpinner = ({ size = 'md', color = 'blue', className = '' }) => {
  const sizeClasses = {
    sm: 'w-5 h-5',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  };

  const colorClasses = {
    blue: 'border-blue-500',
    gray: 'border-gray-500',
    white: 'border-white'
  };

  return (
    <div className={`flex justify-center items-center ${className}`}>
      <div
        className={`
          ${sizeClasses[size]} 
          ${colorClasses[color]}
          border-2 
          border-t-transparent 
          rounded-full 
          animate-spin
        `}
        role="status"
        aria-label="Loading"
      >
        <span className="sr-only">Loading...</span>
      </div>
    </div>
  );
};

// Skeleton loader untuk grid (shimmer effect)
export const GridSkeleton = ({ count = 6, columns = { default: 1, sm: 2, lg: 3 } }) => {
  return (
    <div className={`grid grid-cols-1 gap-4 sm:grid-cols-${columns.sm} lg:grid-cols-${columns.lg}`}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-white rounded-lg shadow-sm p-4 animate-pulse">
          <div className="h-32 bg-gray-200 rounded-md mb-3"></div>
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-3"></div>
          <div className="h-8 bg-gray-200 rounded"></div>
        </div>
      ))}
    </div>
  );
};

export default LoadingSpinner;
