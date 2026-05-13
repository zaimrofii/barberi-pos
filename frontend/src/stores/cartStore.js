import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { CART_STORAGE_KEY } from '../utils/constants'

const MAX_HISTORY = 20;

const useCartStore = create(
  persist(
    (set, get) => ({
      items: [],
      discount: 0,
      history: [], // undo stack

      pushToHistory: () => {
        const { items, discount, history } = get();
        const snapshot = { items: JSON.parse(JSON.stringify(items)), discount };
        const newHistory = [...history, snapshot].slice(-MAX_HISTORY);
        set({ history: newHistory });
      },

      undo: () => {
        const { history } = get();
        if (history.length === 0) return false;
        const previous = history[history.length - 1];
        set({
          items: previous.items,
          discount: previous.discount,
          history: history.slice(0, -1),
        });
        return true;
      },

      addItem: (item) =>
        set((state) => {
          // Push to history before mutation
          const snapshot = { items: JSON.parse(JSON.stringify(state.items)), discount: state.discount };
          const newHistory = [...state.history, snapshot].slice(-MAX_HISTORY);

          const existing = state.items.find((i) => i.id === item.id)
          if (existing) {
            if (item.type === 'PRODUCT' && item.stock !== null) {
              if (existing.quantity >= item.stock) {
                return { ...state, history: newHistory }
              }
            }
            return {
              ...state,
              items: state.items.map((i) =>
                i.id === item.id
                  ? { ...i, quantity: i.quantity + 1 }
                  : i
              ),
              history: newHistory,
            }
          }
          return {
            ...state,
            items: [...state.items, { ...item, quantity: 1 }],
            history: newHistory,
          }
        }),

      updateQuantity: (itemId, quantity) =>
        set((state) => {
          const snapshot = { items: JSON.parse(JSON.stringify(state.items)), discount: state.discount };
          const newHistory = [...state.history, snapshot].slice(-MAX_HISTORY);

          if (quantity <= 0) {
            return {
              ...state,
              items: state.items.filter((i) => i.id !== itemId),
              history: newHistory,
            }
          }
          const item = state.items.find((i) => i.id === itemId)
          if (item && item.type === 'PRODUCT' && item.stock !== null) {
            if (quantity > item.stock) {
              quantity = item.stock
            }
          }
          return {
            ...state,
            items: state.items.map((i) =>
              i.id === itemId ? { ...i, quantity } : i
            ),
            history: newHistory,
          }
        }),

      removeItem: (itemId) =>
        set((state) => {
          const snapshot = { items: JSON.parse(JSON.stringify(state.items)), discount: state.discount };
          const newHistory = [...state.history, snapshot].slice(-MAX_HISTORY);
          return {
            ...state,
            items: state.items.filter((i) => i.id !== itemId),
            history: newHistory,
          }
        }),

      setDiscount: (value) => set((state) => {
        const snapshot = { items: JSON.parse(JSON.stringify(state.items)), discount: state.discount };
        const newHistory = [...state.history, snapshot].slice(-MAX_HISTORY);
        return { ...state, discount: value, history: newHistory };
      }),

      clearCart: () => set((state) => {
        const snapshot = { items: JSON.parse(JSON.stringify(state.items)), discount: state.discount };
        const newHistory = [...state.history, snapshot].slice(-MAX_HISTORY);
        return { ...state, items: [], discount: 0, history: newHistory };
      }),

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
        history: state.history,
      }),
    }
  )
)

export default useCartStore
