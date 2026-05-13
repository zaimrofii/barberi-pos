import { create } from 'zustand';

const useUIStore = create((set) => ({
  isOnline: navigator.onLine,
  isSyncModalOpen: false,
  showRecoveryPopup: false,
  recoveryCartData: null,

  setOnlineStatus: (status) => set({ isOnline: status }),

  openSyncModal: () => set({ isSyncModalOpen: true }),
  closeSyncModal: () => set({ isSyncModalOpen: false }),

  setShowRecoveryPopup: (show) => set({ showRecoveryPopup: show }),
  setRecoveryCartData: (data) => set({ recoveryCartData: data }),
}));

export default useUIStore;
