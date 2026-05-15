  import React, { useState, useEffect } from 'react'
  import { Link } from 'react-router-dom'
  import { Toaster } from 'react-hot-toast'
  import {
    ShoppingCart,
    Search,
    Menu,
    X,
    WifiOff,
    User,
    AlertCircle,
    CloudUpload,
  } from 'lucide-react'
  import SyncQueueModal from '../components/SyncQueueModal'
  // import ShortcutsHelper from '../components/ShortcutsHelper'
  import useUIStore from '../stores/uiStore'
  import useBarberStore from '../stores/barberStore'
  import useKeyboardShortcuts from '../hooks/useKeyboardShortcuts'

  export default function MainLayout({
    children,
    isOffline = false,
    kasirName = 'Kasir',
    cartItemCount = 0,
    cartTotal = 0,
    onCheckout = () => {},
    onSearch = () => {},
    searchValue = '',
    cartContent = null,
  }) {
    const { pendingCount, openSyncModal } = useUIStore()
    const { selectedBarber, barbers } = useBarberStore()
    const currentBarberName = barbers.find(b => b.id === selectedBarber)?.name || kasirName
    useKeyboardShortcuts()
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
    const [mobileCartOpen, setMobileCartOpen] = useState(false)
    const [isMobile, setIsMobile] = useState(false)
    const [isTablet, setIsTablet] = useState(false)

    // Handle keyboard shortcuts
    useEffect(() => {
      const handleKeyDown = (e) => {
        if (e.key === 'F1') {
          e.preventDefault()
          const searchInput = document.querySelector('[data-search-input]')
          if (searchInput) searchInput.focus()
        }
        if (e.key === 'F2') {
          e.preventDefault()
          if (cartItemCount > 0) {
            // Use same custom event as the mobile BAYAR button
            window.dispatchEvent(new CustomEvent('pos:mobile-checkout'))
          }
        }
        if (e.key === 'Escape') {
          e.preventDefault()
          setMobileCartOpen(false)
          setMobileMenuOpen(false)
        }
      }

      window.addEventListener('keydown', handleKeyDown)
      return () => window.removeEventListener('keydown', handleKeyDown)
    }, [cartItemCount])

    // Handle responsive breakpoints
    useEffect(() => {
      const handleResize = () => {
        setIsMobile(window.innerWidth < 768)
        setIsTablet(window.innerWidth >= 768 && window.innerWidth < 1024)
      }

      handleResize()
      window.addEventListener('resize', handleResize)
      return () => window.removeEventListener('resize', handleResize)
    }, [])

    // Open mobile cart if items added
    useEffect(() => {
      if (isMobile && cartItemCount > 0 && !mobileCartOpen) {
        // Auto-open not needed per spec, user taps cart icon
      }
    }, [cartItemCount, isMobile, mobileCartOpen])

    // Mobile layout
    if (isMobile) {
      return (
        <>
          <div className="flex flex-col h-screen" data-component="MainLayout">
            {/* Mobile Header */}
            <header
              data-component="MainLayout.Header"
              className={`fixed top-0 left-0 right-0 z-50 transition-colors ${
                isOffline ? 'bg-error' : 'bg-primary'
              } text-white px-4 py-3`}
            >
              <div className="flex items-center justify-between">
                <button
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  className="p-1 hover:bg-gray-800 rounded"
                >
                  {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                </button>

                <div className="flex items-center gap-1 text-md mr-2">
                    <User size={20} className="text-green-200" />
                    <span className="truncate max-w-[130px]">{currentBarberName}</span>
                  </div>
                <div className="flex items-center gap-2">
                  {/* Barber name mobile */}
                  
                  <button
                    onClick={openSyncModal}
                    className="relative p-1 hover:bg-gray-800 rounded transition"
                    title="Antrian sinkronisasi"
                  >
                    <CloudUpload size={20} className="text-gray-300" />
                    {pendingCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-warning text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                        {pendingCount}
                      </span>
                    )}
                  </button>
                  <button
                    onClick={() => setMobileCartOpen(!mobileCartOpen)}
                    className="relative p-1 hover:bg-gray-800 rounded"
                  >
                    <ShoppingCart size={24} />
                    {cartItemCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-success text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                        {cartItemCount}
                      </span>
                    )}
                  </button>
                </div>
              </div>

              {/* Offline badge mobile */}
              {isOffline && (
                <div className="mt-2 flex items-center justify-center gap-2 text-sm">
                  <span className="inline-flex items-center gap-1">
                    <span className="inline-block w-2 h-2 bg-error/50 rounded-full animate-pulse"></span>
                    OFFLINE MODE • Data disimpan lokal
                  </span>
                </div>
              )}
            </header>

            {/* Mobile menu overlay */}
            {mobileMenuOpen && <div className="fixed inset-0 bg-black bg-opacity-50 z-40 mt-16" />}

            {/* Main content area - products */}
            <main className="flex-1 overflow-y-auto pt-16 pb-20" data-component="MainLayout.Main">
              {children}
            </main>

            {/* Mobile Bottom Navigation */}
            <nav
              className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-3 flex items-center justify-between gap-2"
              data-component="MainLayout.Nav"
            >
              <div className="flex-1 text-sm">
                <span className="text-gray-600">Total:</span>
                <span className="ml-2 font-semibold text-lg">
                  Rp {cartTotal.toLocaleString('id-ID')}
                </span>
              </div>
              <button
                onClick={() => {
                  if (cartItemCount === 0) return
                  
                  if (!mobileCartOpen) {
                    setMobileCartOpen(true)
                    setTimeout(() => {
                      window.dispatchEvent(new CustomEvent('pos:scroll-cart-to-bottom'))
                      window.dispatchEvent(new CustomEvent('pos:mobile-checkout'))
                    }, 200)
                  } else {
                    window.dispatchEvent(new CustomEvent('pos:scroll-cart-to-bottom'))
                    setTimeout(() => {
                      window.dispatchEvent(new CustomEvent('pos:mobile-checkout'))
                    }, 50)
                  }
                }}
                disabled={cartItemCount === 0}
                className={`
                  flex-1 font-semibold py-2 px-3 rounded-lg transition-all duration-200
                  ${cartItemCount === 0 
                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed' 
                    : 'bg-success text-white hover:bg-success-dark active:scale-95 shadow-md'
                  }
                `}
              >
                BAYAR
              </button>
            </nav>

            {/* Mobile Cart Bottom Sheet */}
            {mobileCartOpen && (
              <div
                className="fixed inset-0 bg-black/40 z-30 mt-16"
                onClick={() => setMobileCartOpen(false)}
              >
                <div
                  className="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl shadow-lg h-[70vh] overflow-y-auto transition-transform duration-300"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="sticky z-10 top-0 bg-white border-b border-gray-200 px-4 py-3 rounded-t-2xl flex items-center justify-between">
                    <h2 className="font-bold text-lg flex items-center gap-2">
                      🛒 Keranjang
                      {cartItemCount > 0 && (
                        <span className="bg-success text-white text-xs px-2 py-1 rounded-full">
                          {cartItemCount}
                        </span>
                      )}
                    </h2>
                  </div>

                  <div className="p-4">
                    {cartItemCount === 0 ? (
                      <div className="flex flex-col items-center justify-center py-8 text-gray-500">
                        <ShoppingCart size={48} className="mb-3 text-gray-300" />
                        <p className="font-semibold">Keranjang kosong</p>
                        <p className="text-sm">Klik produk untuk menambahkan</p>
                      </div>
                    ) : (
                      cartContent
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
          <Toaster
            position="bottom-center"
            toastOptions={{
              duration: 3000,
              style: {
                background: '#1f2937',
                color: '#fff',
                borderRadius: '12px',
                padding: '12px 16px',
                fontSize: '14px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              },
            }}
          />
          <SyncQueueModal />
          {/* <ShortcutsHelper /> */}
        </>
      )
    }

    // Tablet layout (768px - 1024px)
    if (isTablet) {
      return (
        <>
          <div className="flex flex-col h-screen bg-white" data-component="MainLayout">
            {/* Tablet Header */}
            <header
              data-component="MainLayout.Header"
              className={`fixed top-0 left-0 right-0 z-40 transition-colors ${
                isOffline ? 'bg-error' : 'bg-primary'
              } text-white px-6 py-4`}
            >
              <div className="flex items-center justify-between">
                <h1 className="font-bold text-xl">BarberPOS</h1>

                <div className="flex items-center gap-4">
                  {/* Status indicator */}
                  {isOffline ? (
                    <div className="flex items-center gap-2 bg-red-600 px-3 py-1 rounded-full text-sm">
                      <WifiOff size={16} />
                      OFFLINE MODE
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-green-400">
                      <span className="inline-block w-2 h-2 bg-green-400 rounded-full"></span>
                      Online
                    </div>
                  )}

                  {/* Kasir info */}
                  <div className="flex items-center gap-2 text-sm">
                    <User size={16} />
                    {currentBarberName}
                  </div>

                  {/* Cart summary */}
                  <div className="flex items-center gap-2 bg-gray-800 px-3 py-1 rounded">
                    <ShoppingCart size={16} />
                    <span>{cartItemCount} item</span>
                    <span className="text-accent">Rp {cartTotal.toLocaleString('id-ID')}</span>
                  </div>
                </div>
              </div>
            </header>

            {/* Main content - 60% products, 40% cart */}
            <div className="flex flex-1 pt-16 overflow-hidden">
              {/* Products area */}
              <main className="flex-1 w-3/5 overflow-y-auto" data-component="MainLayout.Main">
                {children}
              </main>

              {/* Cart sidebar */}
              <aside
                className="w-2/5 bg-white border-l border-gray-200 shadow-lg flex flex-col overflow-hidden"
                data-component="MainLayout.Aside"
              >
                {/* Cart header */}
                <div className="border-b border-gray-200 px-4 py-4 sticky top-0 bg-white">
                  <h2 className="font-bold text-lg flex items-center gap-2">
                    🛒 Keranjang
                    {cartItemCount > 0 && (
                      <span className="bg-success text-white text-xs px-2 py-1 rounded-full">
                        {cartItemCount}
                      </span>
                    )}
                  </h2>
                </div>

                {/* Cart content */}
                <div className="flex-1 overflow-y-auto p-4">
                  {cartItemCount === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-gray-500">
                      <ShoppingCart size={48} className="mb-3 text-gray-300" />
                      <p className="font-semibold">Keranjang kosong</p>
                      <p className="text-sm">Klik produk untuk menambahkan</p>
                    </div>
                  ) : (
                    cartContent
                  )}
                </div>

                {/* Cart footer */}
                {cartItemCount > 0 && (
                  <div className="border-t border-gray-200 p-4 bg-white">
                    <div className="mb-3 pb-3 border-b border-gray-200">
                      <div className="flex justify-between text-sm text-gray-600 mb-2">
                        <span>Subtotal</span>
                        <span>Rp {cartTotal.toLocaleString('id-ID')}</span>
                      </div>
                    </div>
                    <button
                      onClick={onCheckout}
                      className="w-full bg-success text-white font-bold py-3 rounded hover:scale-[1.02] transition-transform"
                    >
                      BAYAR
                    </button>
                  </div>
                )}
              </aside>
            </div>
          </div>
          <Toaster
            position="bottom-center"
            toastOptions={{
              duration: 3000,
              style: {
                background: '#1f2937',
                color: '#fff',
                borderRadius: '12px',
                padding: '12px 16px',
                fontSize: '14px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              },
            }}
          />
          <SyncQueueModal />
          {/* <ShortcutsHelper /> */}
        </>
      )
    }

    // Desktop layout (> 1024px)
    return (
      <>
        <div className="flex flex-col h-screen bg-gray-50" data-component="MainLayout">
          {/* Desktop Header */}
          <header
            data-component="MainLayout.Header"
            className={`fixed top-0 left-0 right-0 z-40 transition-colors ${
              isOffline ? 'bg-error' : 'bg-primary'
            } text-white px-8 py-4`}
          >
            <div className="flex items-center justify-between gap-8">
              {/* Left: Logo */}
              <div className="flex-shrink-0">
                <h1 className="font-bold text-2xl">BarberPOS</h1>
              </div>

              {/* Center: Search bar */}
              <div className="flex-1 max-w-md">
                <div className="relative flex items-center">
                  <input
                    type="text"
                    data-search-input
                    value={searchValue}
                    onChange={(e) => onSearch(e.target.value)}
                    placeholder="Cari produk... (F1)"
                    className="w-full bg-primary-light text-white px-4 py-2 rounded-lg placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-accent"
                  />
                  <Search size={18} className="absolute right-3 text-gray-400 pointer-events-none" />
                </div>
              </div>

              {/* Right: Status and Kasir info */}
              <div className="flex items-center gap-6">
                {/* Navigation links */}
                <Link to="/history" className="text-sm text-gray-300 hover:text-white transition">
                  Riwayat
                </Link>
                <Link to="/reports" className="text-sm text-gray-300 hover:text-white transition">
                  Laporan
                </Link>

                {/* Sync button */}
                <button
                  onClick={openSyncModal}
                  className="relative p-1 hover:bg-gray-800 rounded transition"
                  title="Antrian sinkronisasi"
                >
                  <CloudUpload size={20} className="text-gray-300" />
                  {pendingCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-warning text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                      {pendingCount}
                    </span>
                  )}
                </button>

                {/* Status indicator */}
                {isOffline ? (
                  <div className="flex items-center gap-2 bg-error-dark px-3 py-1 rounded-full text-sm animate-pulse">
                    <span className="inline-block w-2 h-2 bg-error/50 rounded-full animate-pulse"></span>
                    OFFLINE MODE
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <span className="inline-block w-2 h-2 bg-success rounded-full"></span>
                    <span className="text-sm">Online</span>
                  </div>
                )}

                {/* Kasir name */}
                <div className="flex items-center gap-2 text-sm">
                  <User size={16} />
                  {kasirName}
                </div>
              </div>
            </div>

            {/* Offline badge */}
            {isOffline && (
              <div className="mt-3 flex items-center justify-center gap-2 text-sm">
                <AlertCircle size={14} />
                🔴 OFFLINE MODE • Data disimpan lokal
              </div>
            )}
          </header>

          {/* Main content - 65% products, 35% cart */}
          <div className="flex flex-1 pt-16 overflow-hidden">
            {/* Products area */}
            <main className="flex-1 w-13/20 overflow-y-auto" data-component="MainLayout.Main">
              {children}
            </main>

            {/* Cart sidebar - sticky */}
            <aside
              className="w-7/20 bg-white border-l border-gray-200 shadow-lg flex flex-col overflow-hidden sticky right-0 top-16"
              data-component="MainLayout.Aside"
            >
              {/* Cart header */}
              {/* <div className="border-b border-gray-200 px-6 py-4 sticky top-0 bg-white">
                <h2 className="font-bold text-lg flex items-center gap-3">
                  🛒 Keranjang
                  {cartItemCount > 0 && (
                    <span className="bg-green-500 text-white text-xs px-3 py-1 rounded-full font-semibold">
                      {cartItemCount}
                    </span>
                  )}
                </h2>
              </div> */}

              {/* Cart content scrollable */}
              <div className="flex-1 overflow-y-auto px-4 pt-4">
                {cartItemCount === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-gray-500">
                    <ShoppingCart size={56} className="mb-4 text-gray-300" />
                    <p className="font-semibold text-lg">Keranjang kosong</p>
                    <p className="text-sm text-gray-400">Klik produk untuk menambahkan</p>
                  </div>
                ) : (
                  cartContent
                )}
              </div>

              {/* Cart footer - sticky */}
              {/* {cartItemCount > 0 && (
                <div className="border-t border-gray-200 p-3 md:px-6 md:py-2 sticky bottom-0">
                  <div className="mb-2 md:mb-2 pb-2 md:pb-0 ">
                    <div className="flex justify-between text-xs md:text-sm text-gray-600 ">
                      <span>Subtotal</span>
                      <span className="font-normal text-sm md:text-base">
                        Rp {cartTotal.toLocaleString('id-ID')}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={onCheckout}
                    className="w-full bg-green-500 text-white font-bold py-2 md:py-3 rounded-lg hover:scale-[1.02] transition-transform mb-1 md:mb-2 text-sm md:text-base"
                  >
                    BAYAR
                  </button>
                  <p className="text-[10px] md:text-xs text-gray-400 text-center">F2 untuk bayar</p>
                </div>
              )} */}
            </aside>
          </div>
        </div>
        <Toaster
          position="bottom-center"
          toastOptions={{
            duration: 3000,
            style: {
              background: '#1f2937',
              color: '#fff',
              borderRadius: '12px',
              padding: '12px 16px',
              fontSize: '14px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            },
          }}
        />
        <SyncQueueModal />
        {/* <ShortcutsHelper /> */}
      </>
    )
  }
