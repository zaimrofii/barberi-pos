import React, { useState, useEffect, useMemo } from 'react'
import { Search, PackageSearch, Scissors, Droplets, X } from 'lucide-react'
import ProductCard from './ProductCard'
import useItemStore from '../stores/itemStore'
import useCartStore from '../stores/cartStore'
import useUIStore from '../stores/uiStore'

export default function ProductGrid({ activeTab, onTabChange, searchQuery, onSearch }) {
  const { items, loading, error, fetchItems } = useItemStore()
  const addItem = useCartStore((s) => s.addItem)
  const cartItems = useCartStore((s) => s.items)
  const { isQuickPickOpen, closeQuickPickModal } = useUIStore()

  const [selectedCategory, setSelectedCategory] = useState('all')

  // Fetch items on mount
  useEffect(() => {
    fetchItems()
  }, [fetchItems])

  // F1 keyboard shortcut for search with visual feedback
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'F1') {
        e.preventDefault()
        const mobileSearch = document.querySelector('[data-mobile-search]')
        if (mobileSearch) {
          // Add visual feedback
          mobileSearch.classList.add('ring-2', 'ring-green-500', 'ring-offset-2')
          setTimeout(() => {
            mobileSearch.classList.remove('ring-2', 'ring-green-500', 'ring-offset-2')
          }, 500)
          setTimeout(() => mobileSearch.focus(), 100)
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  // Get display items based on tab and search
  const displayItems = useMemo(() => {
    let result = [...items]

    // Filter by tab
    if (activeTab === 'service') {
      result = result.filter((item) => item.type === 'SERVICE')
    } else if (activeTab === 'product') {
      result = result.filter((item) => item.type === 'PRODUCT')
    }

    // Filter by search query
    if (searchQuery) {
      result = result.filter((item) =>
        item.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    // Filter by category
    if (selectedCategory !== 'all') {
      result = result.filter((item) => item.category === selectedCategory)
    }

    return result
  }, [items, activeTab, searchQuery, selectedCategory])

  // Get unique categories from items
  const categories = useMemo(() => {
    const uniqueCategories = new Set()
    items.forEach((item) => {
      if (item.category) {
        uniqueCategories.add(item.category)
      }
    })
    return Array.from(uniqueCategories)
  }, [items])

  const getCategoryLabel = (category) => {
    const labels = {
      hair: 'Rambut',
      beard: 'Jenggot',
      care: 'Perawatan',
    }
    return labels[category] || category
  }

  const getCategoryIcon = (category) => {
    if (category === 'hair') return <Scissors size={12} />
    if (category === 'care') return <Droplets size={12} />
    return null
  }

  const getCartInfo = (itemId) => {
    const cartItem = cartItems.find((i) => i.id === itemId)
    return {
      isInCart: !!cartItem,
      quantity: cartItem ? cartItem.quantity : 0,
    }
  }

  const handleAddToCart = (item) => {
    addItem(item)
  }

  // Loading state
  if (loading) {
    return (
      <div className="p-3 md:p-4">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded-xl h-32 animate-pulse"
            />
          ))}
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-10">
        <PackageSearch size={48} className="text-red-300 mb-3" />
        <h3 className="text-red-500 font-semibold text-lg">Gagal memuat data</h3>
        <p className="text-gray-400 text-sm text-center mb-4">{error}</p>
        <button
          onClick={fetchItems}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
        >
          Coba lagi
        </button>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full overflow-hidden" data-component="ProductGrid">
      {/* Tab Bar */}
      <div className="sticky top-0 z-10 bg-white px-3 md:px-4 py-3 md:py-4 border-b border-gray-200" data-component="ProductGrid.Tabs">
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
      <div className="md:hidden sticky top-24 z-9 bg-white px-3 py-2 border-b border-gray-100" data-component="ProductGrid.Search">
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
        <div className="flex-1 overflow-y-auto px-3 md:px-4 py-3 md:py-4" data-component="ProductGrid.Grid">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {displayItems.map((item) => {
              const { isInCart, quantity } = getCartInfo(item.id)
              return (
                <ProductCard
                  key={item.id}
                  item={item}
                  onAdd={() => handleAddToCart(item)}
                  isInCart={isInCart}
                  cartQuantity={quantity}
                />
              )
            })}
          </div>
        </div>
      )}

      {/* Quick Pick Modal (F4) */}
      {isQuickPickOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full mx-4 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-lg">Pilih Produk Cepat</h2>
              <button
                onClick={closeQuickPickModal}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <X size={20} />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {items.slice(0, 8).map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    handleAddToCart(item);
                    closeQuickPickModal();
                  }}
                  className="p-3 bg-gray-50 rounded-lg border border-gray-100 hover:bg-green-50 hover:border-green-200 transition text-left"
                >
                  <p className="font-medium text-sm">{item.name}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    Rp {item.price.toLocaleString('id-ID')}
                  </p>
                </button>
              ))}
            </div>

            <button
              onClick={closeQuickPickModal}
              className="w-full mt-4 py-2 px-4 rounded font-bold bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
            >
              Tutup (ESC)
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
