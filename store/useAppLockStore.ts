import { create } from 'zustand';

/**
 * Shared app-lock state. Both the enforcement gate (app/_layout.tsx) and the
 * Profile screen's toggle read/write this same store — previously each held
 * its own local useState via useAppLock(), so flipping the Profile switch
 * never reached the instance that actually gated the app, and the switch
 * itself didn't reflect the persisted setting either.
 */
interface AppLockState {
  isLocked: boolean;
  lockEnabled: boolean;
  isAuthenticating: boolean;
  lastError: string | null;
  setIsLocked: (locked: boolean) => void;
  setLockEnabled: (enabled: boolean) => void;
  setIsAuthenticating: (authenticating: boolean) => void;
  setLastError: (error: string | null) => void;
}

export const useAppLockStore = create<AppLockState>((set) => ({
  isLocked: false,
  lockEnabled: false,
  isAuthenticating: false,
  lastError: null,
  setIsLocked: (locked) => set({ isLocked: locked }),
  setLockEnabled: (enabled) => set({ lockEnabled: enabled }),
  setIsAuthenticating: (authenticating) => set({ isAuthenticating: authenticating }),
  setLastError: (error) => set({ lastError: error }),
}));
