import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { CART_STORAGE_KEY } from '../utils/constants'

const useCartStore = create(
  persist(
    (set, get) => ({
      items: [],
      discount: 0,

      addItem: (item) =>
        set((state) => {
          const existing = state.items.find((i) => i.id === item.id)
          if (existing) {
            // For products, check stock limit
            if (item.type === 'PRODUCT' && item.stock !== null) {
              if (existing.quantity >= item.stock) {
                // Cannot add more than stock
                return state
              }
            }
            return {
              items: state.items.map((i) =>
                i.id === item.id
                  ? { ...i, quantity: i.quantity + 1 }
                  : i
              ),
            }
          }
          // New item
          return {
            items: [...state.items, { ...item, quantity: 1 }],
          }
        }),

      updateQuantity: (itemId, quantity) =>
        set((state) => {
          if (quantity <= 0) {
            return { items: state.items.filter((i) => i.id !== itemId) }
          }
          const item = state.items.find((i) => i.id === itemId)
          if (item && item.type === 'PRODUCT' && item.stock !== null) {
            if (quantity > item.stock) {
              quantity = item.stock
            }
          }
          return {
            items: state.items.map((i) =>
              i.id === itemId ? { ...i, quantity } : i
            ),
          }
        }),

      removeItem: (itemId) =>
        set((state) => ({
          items: state.items.filter((i) => i.id !== itemId),
        })),

      setDiscount: (value) => set({ discount: value }),

      clearCart: () => set({ items: [], discount: 0 }),

      getSubtotal: () => {
        const { items } = get()
        return items.reduce(
          (sum, item) => sum + item.price * item.quantity,
          0
        )
      },

      getTotal: () => {
        const { items, discount } = get()
        const subtotal = items.reduce(
          (sum, item) => sum + item.price * item.quantity,
          0
        )
        const total = subtotal - discount
        return total < 0 ? 0 : total
      },

      getItemCount: () => {
        const { items } = get()
        return items.reduce((sum, item) => sum + item.quantity, 0)
      },
    }),
    {
      name: CART_STORAGE_KEY,
      partialize: (state) => ({
        items: state.items,
        discount: state.discount,
      }),
    }
  )
)

export default useCartStore
