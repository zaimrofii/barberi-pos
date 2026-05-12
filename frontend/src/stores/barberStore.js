import { create } from 'zustand'
import { getBarbers } from '../services/barberService'

const useBarberStore = create((set, get) => ({
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
}))

export default useBarberStore
