import { useSyncStore } from '../../store/useSyncStore';

export type SyncStatus = 'synced' | 'saving' | 'offline' | 'waiting';

export function useSyncStatus(): SyncStatus {
  const isOnline = useSyncStore((state) => state.isOnline);
  const isSyncing = useSyncStore((state) => state.isSyncing);
  const pendingCount = useSyncStore((state) => state.pendingCount);

  if (!isOnline) return 'offline';
  if (isSyncing) return 'saving';
  if (pendingCount > 0) return 'waiting';
  return 'synced';
}
