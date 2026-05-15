import toast from 'react-hot-toast'
import React, { useState, useRef, useEffect } from 'react'
import { Scissors, Package, Clock } from 'lucide-react'
import useSoldToday from '../hooks/useSoldToday'

function formatPrice(price) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  })
    .format(price)
    .replace('Rp', 'Rp ')
    .trim()
}

export default React.memo(function ProductCard({ item, onAdd, isInCart, cartQuantity }) {
  const [showTooltip, setShowTooltip] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  const hoverTimeoutRef = useRef(null)
  const { soldToday } = useSoldToday(item.id)

  const isOutOfStock = item.type === 'PRODUCT' && item.stock === 0
  const stockStatus =
    item.type === 'PRODUCT'
      ? item.stock <= 1
        ? 'critical'
        : item.stock <= 5
          ? 'warning'
          : 'normal'
      : null

  const handleMouseEnter = () => {
    if (item.type !== 'PRODUCT') return
    setIsHovered(true)
    // 300ms delay before showing tooltip
    hoverTimeoutRef.current = setTimeout(() => {
      setShowTooltip(true)
    }, 300)
  }

  const handleMouseLeave = () => {
    setIsHovered(false)
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current)
      hoverTimeoutRef.current = null
    }
    setShowTooltip(false)
  }

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current)
      }
    }
  }, [])

  const handleClick = () => {
    if (!isOutOfStock) {
      // Check if adding would exceed stock
      if (item.type === 'PRODUCT' && item.stock !== null && cartQuantity >= item.stock) {
        toast.error(
          `⚠️ Stok tidak mencukupi - Maksimal ${item.stock} item (sisa ${item.stock - cartQuantity})`,
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
      onAdd()
    }
  }

  const handleKeyDown = (e) => {
    if ((e.key === 'Enter' || e.key === ' ') && !isOutOfStock) {
      e.preventDefault()
      // Check if adding would exceed stock
      if (item.type === 'PRODUCT' && item.stock !== null && cartQuantity >= item.stock) {
        toast.error(
          `⚠️ Stok tidak mencukupi - Maksimal ${item.stock} item (sisa ${item.stock - cartQuantity})`,
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
      onAdd()
    }
  }

  const handleButtonClick = (e) => {
    e.stopPropagation()
    // Check if adding would exceed stock
    if (item.type === 'PRODUCT' && item.stock !== null && cartQuantity >= item.stock) {
      toast.error(
        `⚠️ Stok tidak mencukupi - Maksimal ${item.stock} item (sisa ${item.stock - cartQuantity})`,
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
    onAdd()
  }

  const initialStock = item.initial_stock || item.stock || 0
  const needsReorder = item.type === 'PRODUCT' && item.stock <= 3 && item.stock > 0

  return (
    <div
      data-component="ProductCard"
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      role="button"
      tabIndex={0}
      aria-label={`Tambah ${item.name} ke keranjang`}
      aria-disabled={isOutOfStock}
      className={`relative bg-white rounded-xl border  transition-all duration-150 cursor-pointer select-none ${
        isOutOfStock
          ? 'opacity-50 cursor-not-allowed border border-gray-100'
          : isInCart
            ? 'border-green-500 bg-green-50 hover:border-green-600 hover:shadow-sm hover:scale-[1.02] active:scale-[0.98]'
            : 'border-gray-100 hover:border-green-400 hover:shadow-sm hover:scale-[1.02] active:scale-[0.98]'
      }`}
      style={{ padding: '12px' }}
    >
      {/* Tooltip for PRODUCT type */}
      {showTooltip && item.type === 'PRODUCT' && !isOutOfStock && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 pointer-events-none">
          <div
            className="bg-gray-900 text-white text-xs rounded-lg px-3 py-2 shadow-xl whitespace-nowrap"
            style={{
              opacity: showTooltip ? 1 : 0,
              transform: showTooltip ? 'translateY(0)' : 'translateY(4px)',
              transition: 'opacity 0.2s ease-in-out, transform 0.2s ease-in-out',
            }}
          >
            <p className="font-semibold text-sm mb-1">{item.name}</p>
            <p className="text-gray-300">
              Stok: {item.stock} dari {initialStock} awal
            </p>
            <p className="text-gray-300">Terjual hari ini: {soldToday} item</p>
            {needsReorder && (
              <p className="text-yellow-400 font-medium mt-1">💡 Restok diperlukan!</p>
            )}
            {/* Arrow */}
            <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
          </div>
        </div>
      )}

      {/* Icon/Image Area */}
      <div className="relative bg-gray-50 rounded-lg mb-2 h-16 flex items-center justify-center">
        {item.type === 'SERVICE' ? (
          <Scissors size={28} className="text-success" />
        ) : (
          <Package size={28} className="text-blue-600" />
        )}

        {/* Cart quantity badge */}
        {cartQuantity > 0 && (
          <div className="absolute top-1 right-1 bg-success text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold">
            {cartQuantity}
          </div>
        )}
      </div>

      {/* Item Name */}
      <h3 className="font-semibold text-sm text-gray-800 line-clamp-2 leading-tight min-h-10">
        {item.name}
      </h3>

      {/* Price */}
      {/* Price */}
      {/* Price */}
      {/* Price */}
      <div className="text-success font-normal text-sm mt-1 flex flex-col items-start gap-1 md:flex-row md:items-center md:gap-2">
        {formatPrice(item.price)}
        {item.type === 'SERVICE' && (
          <span className="text-gray-400 font-normal text-xs flex items-center gap-1">
            <Clock size={10} />
            {item.duration} min
          </span>
        )}
      </div>

      {/* Stock Indicator (Products only) */}
      {item.type === 'PRODUCT' && (
        <div className="mt-2 b">
          {item.stock === 0 ? (
            <div className="bg-error text-white text-xs font-semibold py-1 px-2 rounded text-center">
              HABIS
            </div>
          ) : stockStatus === 'critical' ? (
            <div className="bg-error/10 text-error-dark border border-error/30 rounded-full px-2 py-1 text-xs font-medium animate-pulse">
              ⚠ Sisa {item.stock}
            </div>
          ) : stockStatus === 'warning' ? (
            <div className="bg-warning/10 text-warning-dark border border-warning/30 rounded-full px-2 py-1 text-xs font-medium">
              Sisa {item.stock}
            </div>
          ) : (
            <div className="text-gray-400 text-xs">Stok: {item.stock}</div>
          )}
        </div>
      )}

      {/* Add Button */}
      <button
        onClick={handleButtonClick}
        disabled={isOutOfStock}
        className={`w-full mt-2 h-8 text-xs font-medium rounded-lg transition-all ${
          isOutOfStock
            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
            : isInCart
              ? 'bg-success/10 text-success-dark border border-success/30 hover:bg-success/20'
              : 'bg-success-dark text-white hover:bg-success-dark'
        }`}
      >
        {isOutOfStock ? 'Stok Habis' : isInCart ? `✓ Ditambah (${cartQuantity})` : '+ Tambah'}
      </button>
    </div>
  )
})
