import React, { useState, useEffect, useCallback, useMemo } from 'react'
import toast from 'react-hot-toast'
import {
  ShoppingCart,
  Trash2,
  X,
  User,
  ChevronDown,
  Check,
  Scissors,
  Package,
  Clock,
  Tag,
  AlertCircle,
  AlertTriangle,
  CreditCard,
  Loader2,
  CheckCircle2,
  CloudUpload,
} from 'lucide-react'
import useCartStore from '../stores/cartStore'
import useBarberStore from '../stores/barberStore'
import useUIStore from '../stores/uiStore'
import ConfirmModal from './ConfirmModal'
import BarberSelectionModal from './BarberSelectionModal'
import { checkout } from '../services/barberService'

// Internal CartItem component
function CartItem({ item, onUpdate, onRemove }) {
  const isAtStockLimit = item.type === 'PRODUCT' && item.quantity >= item.stock
  const isNearStockLimit = item.type === 'PRODUCT' && item.quantity >= item.stock - 1

  const itemTotal = item.price * item.quantity

  return (
    <div className="bg-white rounded-xl p-3 mb-2 shadow-sm hover:shadow-md transition-shadow relative animate-in duration-200">
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <div
            className={`w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0 ${
              item.type === 'SERVICE'
                ? 'bg-purple-100 text-purple-600'
                : 'bg-blue-100 text-blue-600'
            }`}
          >
            {item.type === 'SERVICE' ? <Scissors size={14} /> : <Package size={14} />}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm text-gray-800 line-clamp-1">{item.name}</p>
            {item.type === 'SERVICE' && item.duration && (
              <div className="flex items-center gap-1 text-gray-400 text-xs mt-0.5">
                <Clock size={12} />
                <span>{item.duration} menit</span>
              </div>
            )}
          </div>
        </div>
        <button
          onClick={() => onRemove(item.id)}
          className="text-gray-400 hover:text-red-500 transition flex-shrink-0"
          aria-label="Remove item"
        >
          <X size={14} />
        </button>
      </div>

      <div className="flex justify-between items-center text-xs mb-2">
        <span className="text-gray-500">@ Rp {item.price.toLocaleString('id-ID')}</span>
        <span className="text-green-600 font-bold text-sm">
          Rp {itemTotal.toLocaleString('id-ID')}
        </span>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1">
          <button
            onClick={() => onUpdate(item.id, item.quantity - 1)}
            className={`w-7 h-7 rounded-lg flex items-center justify-center transition ${
              item.quantity === 1
                ? 'bg-red-50 text-red-500 border border-red-200'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
            aria-label="Decrease quantity"
          >
            −
          </button>
          <div className="w-8 text-center font-bold text-sm text-gray-800">{item.quantity}</div>
          <button
            onClick={() => onUpdate(item.id, item.quantity + 1)}
            disabled={isAtStockLimit}
            className={`w-7 h-7 rounded-lg flex items-center justify-center transition ${
              isAtStockLimit
                ? 'bg-gray-100 text-gray-300 cursor-not-allowed opacity-50'
                : 'bg-green-50 text-green-600 border border-green-200 hover:bg-green-100'
            }`}
            aria-label="Increase quantity"
          >
            +
          </button>
        </div>

        {isNearStockLimit && (
          <div className="flex items-center gap-1 text-orange-500 text-xs">
            <AlertTriangle size={10} />
            <span>Max stok</span>
          </div>
        )}
      </div>
    </div>
  )
}

// Main CartPanel component
export default function CartPanel({ isOffline }) {
  const {
    items,
    discount,
    setDiscount,
    updateQuantity,
    removeItem,
    clearCart,
    getSubtotal,
    getTotal,
  } = useCartStore()
  const { barbers, fetchBarbers, selectedBarber, setSelectedBarber } = useBarberStore()
  const { pendingCount } = useUIStore()

  const [barberOpen, setBarberOpen] = useState(false)
  const [discountType, setDiscountType] = useState('nominal')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [barberLoading, setBarberLoading] = useState(false)
  const [successState, setSuccessState] = useState(false)
  const [confirmModalOpen, setConfirmModalOpen] = useState(false)
  const [showBarberModal, setShowBarberModal] = useState(false)

  const handleUpdateQuantity = useCallback(
    (itemId, newQuantity) => {
      if (newQuantity <= 0) {
        removeItem(itemId)
      } else {
        const item = items.find((i) => i.id === itemId)
        if (item && item.type === 'PRODUCT' && item.stock !== null && newQuantity > item.stock) {
          toast.error(
            `⚠️ Stok tidak mencukupi - Maksimal ${item.stock} item (sisa ${item.stock - item.quantity})`,
            {
              duration: 3000,
              position: 'bottom-center',
              style: {
                background: '#1f2937',
                color: '#fff',
                borderRadius: '12px',
                padding: '12px 16px',
                fontSize: '14px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              },
              icon: '⚠️',
            }
          )
          return
        }
        updateQuantity(itemId, newQuantity)
      }
    },
    [updateQuantity, removeItem, items]
  )

  const handleRemoveItem = useCallback(
    (itemId) => {
      removeItem(itemId)
    },
    [removeItem]
  )

  const handleClearCart = useCallback(() => {
    setConfirmModalOpen(true)
  }, [])

  const handleConfirmClear = useCallback(() => {
    clearCart()
    setConfirmModalOpen(false)
  }, [clearCart])

  const handleCheckout = useCallback(async () => {
    setError(null)

    // Get fresh selectedBarber directly from store (bypass stale closure)
    const currentBarber = useBarberStore.getState().selectedBarber

    if (items.length === 0) {
      setError('Keranjang masih kosong')
      return
    }

    if (!currentBarber && items.length > 0) {
      setShowBarberModal(true)
      return
    }

    if (isOffline) {
      // Save to localStorage
      const payload = {
        local_id: crypto.randomUUID(),
        barber_id: currentBarber,
        discount: discount,
        items: items.map((item) => ({ item_id: item.id, quantity: item.quantity })),
      }

      const queue = JSON.parse(localStorage.getItem('pos_offline_queue') || '[]')
      queue.push(payload)
      localStorage.setItem('pos_offline_queue', JSON.stringify(queue))

      setSuccessState(true)
      window.dispatchEvent(new CustomEvent('pos:offline-save', { detail: payload }))

      setTimeout(() => {
        clearCart()
        setSuccessState(false)
      }, 1500)

      return
    }

    // Online checkout
    setLoading(true)
    try {
      const payload = {
        local_id: crypto.randomUUID(),
        barber_id: currentBarber,
        discount: discount,
        items: items.map((item) => ({ item_id: item.id, quantity: item.quantity })),
      }

      const response = await checkout(payload)

      setSuccessState(true)
      window.dispatchEvent(new CustomEvent('pos:checkout-success', { detail: response.data }))

      setTimeout(() => {
        clearCart()
        setSuccessState(false)
      }, 1500)
    } catch (err) {
      setError(err.response?.data?.detail || 'Transaksi gagal. Coba lagi.')
    } finally {
      setLoading(false)
    }
  }, [items, discount, isOffline, clearCart])

  const handleBarberSelected = useCallback(() => {
    setShowBarberModal(false)
    handleCheckout()  // Direct call - no setTimeout needed
  }, [handleCheckout])

  const handleDiscountChange = (e) => {
    const value = parseFloat(e.target.value) || 0
    if (discountType === 'percent') {
      setDiscount((getSubtotal() * value) / 100)
    } else {
      setDiscount(value)
    }
  }

  const computedDiscount = useMemo(() => {
    if (discountType === 'percent' && discount > 0) {
      return Math.round((discount / getSubtotal()) * 100)
    }
    return discount
  }, [discount, discountType, getSubtotal()])

  
  // Fetch barbers on mount
  useEffect(() => {
    setBarberLoading(true)
    fetchBarbers().finally(() => setBarberLoading(false))
  }, [fetchBarbers])

  // Close barber dropdown when clicking outside
  useEffect(() => {
    if (!barberOpen) return

    const handleMouseDown = (e) => {
      const dropdown = document.getElementById('barber-dropdown')
      if (dropdown && !dropdown.contains(e.target)) {
        setBarberOpen(false)
      }
    }

    document.addEventListener('mousedown', handleMouseDown)
    return () => document.removeEventListener('mousedown', handleMouseDown)
  }, [barberOpen])

  // Auto-dismiss error after 3 seconds
  useEffect(() => {
    if (!error) return

    const timer = setTimeout(() => setError(null), 3000)
    return () => clearTimeout(timer)
  }, [error])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'F2' && !loading) {
        e.preventDefault()
        handleCheckout()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [loading, items, selectedBarber, discount, handleCheckout])

  
  useEffect(() => {
    const handleMobileCheckout = () => {
      handleCheckout()
    }
    
    window.addEventListener('pos:mobile-checkout', handleMobileCheckout)
    return () => window.removeEventListener('pos:mobile-checkout', handleMobileCheckout)
  }, [handleCheckout])
  

  // Auto-scroll to bottom when cart items change or when requested
  useEffect(() => {
    const scrollToBottom = () => {
      const cartItemsContainer = document.querySelector('[data-cart-items-container]')
      if (cartItemsContainer) {
        cartItemsContainer.scrollTo({
          top: cartItemsContainer.scrollHeight,
          behavior: 'smooth'
        })
      }
    }

    // Scroll when items change (new item added)
    if (items.length > 0) {
      scrollToBottom()
    }

    // Listen for manual scroll request from mobile checkout
    const handleScrollRequest = () => {
      scrollToBottom()
    }
    
    window.addEventListener('pos:scroll-cart-to-bottom', handleScrollRequest)
    return () => window.removeEventListener('pos:scroll-cart-to-bottom', handleScrollRequest)
  }, [items.length])

  
  const subtotal = getSubtotal()
  const total = getTotal()
  const selectedBarberName = barbers.find((b) => b.id === selectedBarber)?.name
  const barberColors = [
    'bg-red-100',
    'bg-blue-100',
    'bg-green-100',
    'bg-purple-100',
    'bg-orange-100',
  ]

  // Desktop version
  // Desktop Panel - Bagian Summary & Checkout (ringkas & lega)
const desktopPanel = (
  <div className="flex flex-col h-full bg-white" data-component="CartPanel">
    {/* Section 1: Header - tetap sama */}
    <div className=" border-b border-gray-200 px-4 py-3 flex items-center justify-between flex-shrink-0">
      <div className="flex items-center gap-2">
        <ShoppingCart size={20} className="text-green-600" />
        <span className="font-bold text-gray-800">Keranjang</span>
        {items.length > 0 && (
          <span className="bg-green-600 text-white text-xs rounded-full px-2 py-0.5 ml-2 font-medium">
            {items.length} item
          </span>
        )}
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={() => window.dispatchEvent(new CustomEvent('pos:open-sync-modal'))}
          className="relative p-1 hover:bg-gray-100 rounded transition"
          title="Antrian sinkronisasi"
        >
          <CloudUpload size={18} className="text-gray-400" />
          {pendingCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-yellow-500 text-white text-xs font-bold rounded-full w-4 h-4 flex items-center justify-center">
              {pendingCount}
            </span>
          )}
        </button>
        {items.length > 0 && (
          <button
            onClick={handleClearCart}
            className="text-gray-400 hover:text-red-500 transition p-1"
            title="Kosongkan keranjang"
          >
            <Trash2 size={18} />
          </button>
        )}
      </div>
    </div>

    {/* Section 2: Barber Selector - tetap sama */}
    <div className="bg-gray-50 border-b border-gray-100 px-4 py-1 flex-shrink-0">
      
      <div id="barber-dropdown" className="relative">
        {barberLoading ? (
          <div className="space-y-1">
            <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4"></div>
          </div>
        ) : (
          <>
            <button
              onClick={() => setBarberOpen(!barberOpen)}
              className="w-full bg-white border border-gray-200 rounded-lg h-10 px-3 flex items-center justify-between hover:border-gray-300 transition"
            >
              <div className="flex items-center gap-2">
                <User size={16} className="text-gray-400" />
                <span className={selectedBarber ? 'text-gray-800' : 'text-gray-400'}>
                  {selectedBarberName || 'Pilih barber...'}
                </span>
                {selectedBarber && <div className="w-2 h-2 rounded-full bg-green-500"></div>}
              </div>
              <ChevronDown
                size={16}
                className={`text-gray-400 transition transform ${barberOpen ? 'rotate-180' : ''}`}
              />
            </button>

            {barberOpen && (
              <div className="absolute top-12 left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-40 overflow-y-auto">
                {barbers.map((barber, idx) => (
                  <button
                    key={barber.id}
                    onClick={() => {
                      setSelectedBarber(barber.id)
                      setBarberOpen(false)
                    }}
                    className={`w-full px-3 py-2 flex items-center gap-2 hover:bg-green-50 transition ${
                      selectedBarber === barber.id ? 'bg-green-50 text-green-700' : 'text-gray-800'
                    }`}
                  >
                    <div className={`w-2 h-2 rounded-full ${barberColors[idx % barberColors.length]}`}></div>
                    <span className="flex-1 text-left text-sm">{barber.name}</span>
                    {selectedBarber === barber.id && <Check size={16} />}
                  </button>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>

    {/* Section 2.5: Error Banner - di pindah ke sini agar lebih terlihat */}
    {error && (
      <div className="bg-red-50 border-l-4 border-red-500 mx-3 mt-2 rounded-lg px-3 py-2 flex items-center gap-2 animate-in slide-in-from-top-2">
        <AlertCircle size={14} className="text-red-500 flex-shrink-0" />
        <p className="text-red-600 text-xs">{error}</p>
      </div>
    )}

    {/* Section 3: Cart Items */}
    <div 
      className="flex-1 overflow-y-auto px-3 py-2 bg-gray-50" 
      data-component="CartPanel.Items"
      data-cart-items-container
    >
      {items.length === 0 ? (
        <div className="h-full flex flex-col items-center justify-center">
          <ShoppingCart size={40} className="text-gray-300" />
          <p className="text-gray-400 font-medium mt-2">Keranjang kosong</p>
          <p className="text-gray-300 text-sm">Ketuk produk untuk menambahkan</p>
          <div className="bg-gray-100 rounded-full px-3 py-1 text-xs text-gray-400 mt-4">
            💡 Tekan F1 untuk cari produk
          </div>
        </div>
      ) : (
        items.map((item) => (
          <CartItem
            key={item.id}
            item={item}
            onUpdate={handleUpdateQuantity}
            onRemove={handleRemoveItem}
          />
        ))
      )}
    </div>

    {/* Section 4: Discount Input - minimalis */}
    {items.length > 0 && (
      <div className=" bg-white px-4 py-1 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-1">
          <Tag size={14} className="text-gray-400" />
          <span className="text-xs text-gray-500">Diskon</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex gap-0.5 bg-gray-100 rounded-lg p-0.5">
            <button
              onClick={() => setDiscountType('nominal')}
              className={`text-xs px-2 py-1 rounded transition ${
                discountType === 'nominal'
                  ? 'bg-white text-green-600 shadow-sm'
                  : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              Rp
            </button>
            <button
              onClick={() => setDiscountType('percent')}
              className={`text-xs px-2 py-1 rounded transition ${
                discountType === 'percent'
                  ? 'bg-white text-green-600 shadow-sm'
                  : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              %
            </button>
          </div>
          <input
            data-discount-input
            type="number"
            value={discountType === 'percent' ? computedDiscount : discount}
            onChange={handleDiscountChange}
            min="0"
            max={discountType === 'percent' ? 100 : undefined}
            className="w-24 text-right border-0 bg-gray-50 rounded-lg px-2 py-1.5 text-sm focus:ring-1 focus:ring-green-500"
            placeholder="0"
          />
        </div>
      </div>
    )}

    {/* Section 5: Checkout Button - ringkas & total di dalam tombol */}
    {items.length > 0 && (
      <div className=" px-4 pb-3 pt-1 flex-shrink-0 ">
        {successState ? (
          <div className="flex flex-col items-center justify-center py-4">
            <CheckCircle2 size={40} className="text-green-500 animate-bounce" />
            <p className="text-green-600 font-bold text-base mt-1">Transaksi Berhasil!</p>
            <p className="text-gray-500 text-sm">Rp {total.toLocaleString('id-ID')}</p>
          </div>
        ) : (
          <button
            data-checkout-btn
            onClick={handleCheckout}
            disabled={loading || items.length === 0}
            className={`w-full h-12 rounded-xl font-bold text-base flex items-center justify-between px-4 transition-all ${
              loading
                ? 'bg-green-600 text-white opacity-90 cursor-not-allowed'
                : isOffline
                  ? 'bg-amber-500 hover:bg-amber-600 text-white'
                  : items.length === 0
                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    : 'bg-green-600 hover:bg-green-700 text-white shadow-md hover:shadow-lg'
            }`}
            title={items.length === 0 ? 'Keranjang masih kosong' : ''}
          >
            <div className="flex items-center gap-2">
              {loading ? (
                <Loader2 size={18} className="animate-spin" />
              ) : isOffline ? (
                <CloudUpload size={18} />
              ) : (
                <CreditCard size={18} />
              )}
              <span>
                {loading
                  ? 'Memproses...'
                  : isOffline
                    ? 'Simpan Lokal'
                    : 'Bayar'}
              </span>
            </div>
            <span className="text-lg font-bold">
              Rp {total.toLocaleString('id-ID')}
            </span>
          </button>
        )}
        
        {isOffline && items.length > 0 && !successState && (
          <p className="text-amber-600 text-xs text-center mt-2">
            🔄 Akan disinkronkan saat online
          </p>
        )}
        
        {/* {items.length > 0 && !successState && (
          <p className="text-gray-400 text-xs text-center mt-2 hidden md:block">
            ⌨ Tekan F2 untuk checkout cepat
          </p>
        )} */}
      </div>
    )}
  </div>
)
  return (
    <>
      {desktopPanel}
      {/* {mobilePanel} */}
      <ConfirmModal
        isOpen={confirmModalOpen}
        onClose={() => setConfirmModalOpen(false)}
        onConfirm={handleConfirmClear}
        title="Hapus Semua Item"
        message="Apakah Anda yakin ingin menghapus semua item dari keranjang?"
        confirmText="🗑️ Hapus"
        cancelText="Batal"
        confirmVariant="danger"
      />
      <BarberSelectionModal
        isOpen={showBarberModal}
        onClose={() => setShowBarberModal(false)}
        onSelect={handleBarberSelected}
      />
    </>
  )
}
