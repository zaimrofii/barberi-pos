import { create } from 'zustand';

const useUIStore = create((set) => ({
  isOnline: navigator.onLine,
  isSyncModalOpen: false,
  showRecoveryPopup: false,
  recoveryCartData: null,
  syncProgress: 0,
  syncStatus: 'idle',
  pendingCount: 0,
  lastSaveTime: null,
  saveStatus: 'idle', // 'idle' | 'saving' | 'saved' | 'error'

  setOnlineStatus: (status) => set({ isOnline: status }),

  openSyncModal: () => set({ isSyncModalOpen: true }),
  closeSyncModal: () => set({ isSyncModalOpen: false }),

  setShowRecoveryPopup: (show) => set({ showRecoveryPopup: show }),
  setRecoveryCartData: (data) => set({ recoveryCartData: data }),

  setSyncProgress: (progress) => set({ syncProgress: progress }),
  setSyncStatus: (status) => set({ syncStatus: status }),
  setPendingCount: (count) => set({ pendingCount: count }),

  setLastSaveTime: (time) => set({ lastSaveTime: time }),
  setSaveStatus: (status) => set({ saveStatus: status }),
}));

export default useUIStore;
