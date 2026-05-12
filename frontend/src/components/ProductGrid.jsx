import React, { useState, useEffect, useMemo } from 'react';
import { Search, PackageSearch, Scissors, Droplets } from 'lucide-react';
import ProductCard from './ProductCard';

// Mock Zustand store - replace with actual import when available
const useItemStore = () => {
  const [items, setItems] = useState({ services: [], products: [] });
  const [loading, setLoading] = useState(false);

  const fetchItems = async () => {
    setLoading(true);
    try {
      // Mock data - replace with actual API call
      setItems({
        services: [
          { id: 1, name: 'Haircut', price: 50000, type: 'SERVICE', duration: 30, category: 'hair' },
          { id: 2, name: 'Shave', price: 30000, type: 'SERVICE', duration: 20, category: 'beard' },
          { id: 3, name: 'Hair Wash', price: 20000, type: 'SERVICE', duration: 15, category: 'hair' },
          { id: 4, name: 'Styling', price: 40000, type: 'SERVICE', duration: 25, category: 'hair' },
        ],
        products: [
          { id: 101, name: 'Shampoo Premium', price: 25000, type: 'PRODUCT', stock: 3, category: 'care' },
          { id: 102, name: 'Conditioner', price: 20000, type: 'PRODUCT', stock: 0, category: 'care' },
          { id: 103, name: 'Beard Oil', price: 35000, type: 'PRODUCT', stock: 8, category: 'beard' },
          { id: 104, name: 'Hair Wax', price: 15000, type: 'PRODUCT', stock: 12, category: 'hair' },
        ],
      });
    } finally {
      setLoading(false);
    }
  };

  return { items, loading, fetchItems };
};

export default function ProductGrid({ activeTab, onTabChange, searchQuery, onSearch, onAddToCart }) {
  const { items, loading, fetchItems } = useItemStore();
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);

  // Fetch items on mount
  useEffect(() => {
    fetchItems();
  }, []);

  // F1 keyboard shortcut for search
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'F1') {
        e.preventDefault();
        const mobileSearch = document.querySelector('[data-mobile-search]');
        if (mobileSearch) {
          setMobileSearchOpen(true);
          setTimeout(() => mobileSearch.focus(), 100);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Get display items based on tab and search
  const displayItems = useMemo(() => {
    let result = [];

    // Filter by tab
    if (activeTab === 'all') {
      result = [...items.services, ...items.products];
    } else if (activeTab === 'service') {
      result = items.services;
    } else if (activeTab === 'product') {
      result = items.products;
    }

    // Filter by search query
    if (searchQuery) {
      result = result.filter((item) =>
        item.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filter by category
    if (selectedCategory !== 'all') {
      result = result.filter((item) => item.category === selectedCategory);
    }

    return result;
  }, [items, activeTab, searchQuery, selectedCategory]);

  // Get unique categories from display items
  const categories = useMemo(() => {
    const uniqueCategories = new Set();
    [...items.services, ...items.products].forEach((item) => {
      if (item.category) {
        uniqueCategories.add(item.category);
      }
    });
    return Array.from(uniqueCategories);
  }, [items]);

  const getCategoryLabel = (category) => {
    const labels = {
      hair: 'Rambut',
      beard: 'Jenggot',
      care: 'Perawatan',
    };
    return labels[category] || category;
  };

  const getCategoryIcon = (category) => {
    if (category === 'hair') return <Scissors size={12} />;
    if (category === 'care') return <Droplets size={12} />;
    return null;
  };

  // Mock cart store - replace with actual import
  const cartItems = {};
  const getCartInfo = (itemId) => ({
    isInCart: false,
    quantity: 0,
  });

  const handleAddToCart = (item) => {
    onAddToCart(item);
  };

  if (loading) {
    return (
      <div className="p-3 md:p-4">
        <div className={`grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3`}>
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded-xl h-32 animate-pulse"
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Tab Bar */}
      <div className="sticky top-0 z-10 bg-white px-3 md:px-4 py-3 md:py-4 border-b border-gray-200">
        <div className="flex gap-1 bg-gray-100 rounded-full p-1 inline-flex w-full md:w-auto">
          <button
            onClick={() => onTabChange('all')}
            className={`flex-1 md:flex-none px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              activeTab === 'all'
                ? 'bg-green-600 text-white'
                : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            Semua
          </button>
          <button
            onClick={() => onTabChange('service')}
            className={`flex-1 md:flex-none px-4 py-1.5 rounded-full text-sm font-medium transition-colors flex items-center justify-center gap-1 ${
              activeTab === 'service'
                ? 'bg-green-600 text-white'
                : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            <Scissors size={16} />
            <span className="hidden sm:inline">Layanan</span>
          </button>
          <button
            onClick={() => onTabChange('product')}
            className={`flex-1 md:flex-none px-4 py-1.5 rounded-full text-sm font-medium transition-colors flex items-center justify-center gap-1 ${
              activeTab === 'product'
                ? 'bg-green-600 text-white'
                : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            <span className="hidden sm:inline">Produk</span>
            {activeTab === 'product' && <Scissors size={0} />}
          </button>
        </div>
      </div>

      {/* Category Filter Chips */}
      <div className="sticky top-12 md:top-14 z-9 bg-white px-3 md:px-4 py-2 border-b border-gray-100 overflow-x-auto scrollbar-hide">
        <div className="flex gap-2 flex-nowrap">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`flex-shrink-0 px-3 py-1 rounded-full border text-xs font-medium transition-colors ${
              selectedCategory === 'all'
                ? 'bg-green-100 text-green-700 border-green-300'
                : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
            }`}
          >
            Semua Kategori
          </button>
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`flex-shrink-0 px-3 py-1 rounded-full border text-xs font-medium transition-colors flex items-center gap-1 ${
                selectedCategory === category
                  ? 'bg-green-100 text-green-700 border-green-300'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
              }`}
            >
              {getCategoryIcon(category)}
              {getCategoryLabel(category)}
            </button>
          ))}
        </div>
      </div>

      {/* Mobile Search Bar */}
      <div className="hidden md:hidden sticky top-24 z-9 bg-white px-3 py-2 border-b border-gray-100">
        <div className="relative flex items-center">
          <Search size={18} className="absolute left-3 text-gray-400 pointer-events-none" />
          <input
            type="text"
            data-mobile-search
            value={searchQuery}
            onChange={(e) => onSearch(e.target.value)}
            placeholder="Cari layanan atau produk..."
            className="w-full bg-gray-50 text-gray-800 pl-10 pr-4 py-2 rounded-full border border-gray-200 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
          />
        </div>
      </div>

      {/* Empty State */}
      {displayItems.length === 0 && (
        <div className="flex-1 flex flex-col items-center justify-center px-4">
          <PackageSearch size={48} className="text-gray-300 mb-3" />
          <h3 className="text-gray-500 font-semibold text-lg">Produk tidak ditemukan</h3>
          <p className="text-gray-400 text-sm text-center">
            Coba kata kunci lain atau pilih kategori berbeda
          </p>
          {searchQuery && (
            <p className="text-green-600 text-xs font-medium mt-3">
              Hasil untuk: "{searchQuery}"
            </p>
          )}
        </div>
      )}

      {/* Products Grid */}
      {displayItems.length > 0 && (
        <div className="flex-1 overflow-y-auto px-3 md:px-4 py-3 md:py-4">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {displayItems.map((item) => {
              const { isInCart, quantity } = getCartInfo(item.id);
              return (
                <ProductCard
                  key={item.id}
                  item={item}
                  onAdd={() => handleAddToCart(item)}
                  isInCart={isInCart}
                  cartQuantity={quantity}
                />
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
