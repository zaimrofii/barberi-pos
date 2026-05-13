import { useState, useEffect } from 'react';

// Mock data untuk sold today per product
const MOCK_SOLD_TODAY = {
  1: 5,   // Haircut
  2: 3,   // Shave
  3: 2,   // Hair Wash
  4: 4,   // Styling
  101: 1, // Shampoo Premium
  102: 0, // Conditioner
  103: 2, // Beard Oil
  104: 3, // Hair Wax
};

export default function useSoldToday(productId) {
  const [soldToday, setSoldToday] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!productId) return;

    setLoading(true);
    // Simulate API call
    const timer = setTimeout(() => {
      setSoldToday(MOCK_SOLD_TODAY[productId] || 0);
      setLoading(false);
    }, 100);

    return () => clearTimeout(timer);
  }, [productId]);

  return { soldToday, loading };
}
