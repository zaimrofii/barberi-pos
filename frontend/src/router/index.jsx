import { createBrowserRouter, Navigate } from 'react-router-dom';
import RootLayout from '../layouts/RootLayout';
import MainLayout from '../layouts/MainLayout';
import ProductGrid from '../components/ProductGrid';
import CartPanel from '../components/CartPanel';
import History from '../pages/History';
import CommissionReport from '../pages/CommissionReport';
import NotFound from '../pages/NotFound';
import RecoveryPopup from '../components/RecoveryPopup';
import SyncQueueModal from '../components/SyncQueueModal';
import useCartStore from '../stores/cartStore';
import useUIStore from '../stores/uiStore';
import React, { useState } from 'react';

// Shared components that wrap the POS layout
const PosLayout = ({ children }) => {
  const { getItemCount, getTotal } = useCartStore();
  const { isOnline } = useUIStore();
  const [mobileCartOpen, setMobileCartOpen] = useState(false);

  return (
    <MainLayout
      kasirName="Kasir"
      cartItemCount={getItemCount()}
      cartTotal={getTotal()}
      onCheckout={() => {}}
      onSearch={() => {}}
      searchValue=""
      cartContent={
        <CartPanel
          onMobileClose={() => setMobileCartOpen(false)}
          isOffline={!isOnline}
        />
      }
    >
      {children}
      <RecoveryPopup />
      <SyncQueueModal />
    </MainLayout>
  );
};

export const router = createBrowserRouter([
  {
    path: '/',
    element: <RootLayout />,
    errorElement: <NotFound />,
    children: [
      {
        path: '/',
        element: <Navigate to="/pos" replace />,
      },
      {
        path: '/pos',
        element: (
          <PosLayout>
            <ProductGrid />
          </PosLayout>
        ),
      },
      {
        path: '/history',
        element: <History />,
      },
      {
        path: '/reports',
        element: <CommissionReport />,
      },
      {
        path: '*',
        element: <NotFound />,
      },
    ],
  },
]);
