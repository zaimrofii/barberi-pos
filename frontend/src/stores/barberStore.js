import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { getBarbers } from '../services/barberService'

const useBarberStore = create(
  persist(
    (set, get) => ({
      barbers: [],
      selectedBarber: null,
      loading: false,
      error: null,

      fetchBarbers: async () => {
        set({ loading: true, error: null })
        try {
          const data = await getBarbers()
          set({ barbers: data, loading: false })
        } catch (err) {
          set({ error: err.message || 'Gagal memuat barber', loading: false })
        }
      },

      setSelectedBarber: (id) => set({ selectedBarber: id }),

      getSelectedBarberName: () => {
        const { barbers, selectedBarber } = get()
        const barber = barbers.find((b) => b.id === selectedBarber)
        return barber ? barber.name : ''
      },

      // Optional: method to clear stored barber (for testing/debugging)
      clearStoredBarber: () => set({ selectedBarber: null }),
    }),
    {
      name: 'barberPOS_selected_barber', // localStorage key
      partialize: (state) => ({ selectedBarber: state.selectedBarber }), // only persist selectedBarber
    }
  )
)

export default useBarberStore
