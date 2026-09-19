import { create } from 'zustand';

interface SyncStoreState {
  isOnline: boolean;
  pendingCount: number;
  /** Queue entries the sync engine has permanently given up on (exhausted retries or a non-retryable error) - see lib/sync/queue.ts markAttemptFailed. Not folded into pendingCount so existing consumers of that field are unaffected. */
  failedCount: number;
  isSyncing: boolean;
  setOnline: (online: boolean) => void;
  setPendingCount: (count: number) => void;
  setFailedCount: (count: number) => void;
  setSyncing: (syncing: boolean) => void;
}

export const useSyncStore = create<SyncStoreState>((set) => ({
  isOnline: true,
  pendingCount: 0,
  failedCount: 0,
  isSyncing: false,
  setOnline: (online) => set({ isOnline: online }),
  setPendingCount: (count) => set({ pendingCount: count }),
  setFailedCount: (count) => set({ failedCount: count }),
  setSyncing: (syncing) => set({ isSyncing: syncing }),
}));
