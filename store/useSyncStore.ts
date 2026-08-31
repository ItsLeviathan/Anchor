import { create } from 'zustand';

interface SyncStoreState {
  isOnline: boolean;
  pendingCount: number;
  isSyncing: boolean;
  setOnline: (online: boolean) => void;
  setPendingCount: (count: number) => void;
  setSyncing: (syncing: boolean) => void;
}

export const useSyncStore = create<SyncStoreState>((set) => ({
  isOnline: true,
  pendingCount: 0,
  isSyncing: false,
  setOnline: (online) => set({ isOnline: online }),
  setPendingCount: (count) => set({ pendingCount: count }),
  setSyncing: (syncing) => set({ isSyncing: syncing }),
}));
