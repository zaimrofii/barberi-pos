import { create } from 'zustand';

const useUIStore = create((set) => ({
  isOnline: navigator.onLine,
  isSyncModalOpen: false,
  showRecoveryPopup: false,
  recoveryCartData: null,
  syncProgress: 0,
  syncStatus: 'idle', // 'idle' | 'syncing' | 'error'
  pendingCount: 0,

  setOnlineStatus: (status) => set({ isOnline: status }),

  openSyncModal: () => set({ isSyncModalOpen: true }),
  closeSyncModal: () => set({ isSyncModalOpen: false }),

  setShowRecoveryPopup: (show) => set({ showRecoveryPopup: show }),
  setRecoveryCartData: (data) => set({ recoveryCartData: data }),

  setSyncProgress: (progress) => set({ syncProgress: progress }),
  setSyncStatus: (status) => set({ syncStatus: status }),
  setPendingCount: (count) => set({ pendingCount: count }),
}));

export default useUIStore;
