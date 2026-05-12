import { create } from 'zustand'
import { getItems } from '../services/barberService'

const useItemStore = create((set, get) => ({
  items: [],
  loading: false,
  error: null,

  fetchItems: async () => {
    set({ loading: true, error: null })
    try {
      // Fetch both services and products, then combine
      const [services, products] = await Promise.all([
        getItems('SERVICE'),
        getItems('PRODUCT'),
      ])
      const allItems = [...services, ...products]
      set({ items: allItems, loading: false })
    } catch (err) {
      set({ error: err.message || 'Gagal memuat item', loading: false })
    }
  },

  getItemById: (id) => {
    return get().items.find((item) => item.id === id)
  },
}))

export default useItemStore
