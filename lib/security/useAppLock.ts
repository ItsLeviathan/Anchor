import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, type AppStateStatus } from 'react-native';

import {
  authenticateWithBiometric,
  isBiometricAvailable,
  isAppLockEnabled,
} from './appLock';

// How long the app must be backgrounded before it re-locks (ms).
const LOCK_AFTER_BACKGROUND_MS = 15_000;

export function useAppLock() {
  const [isLocked, setIsLocked] = useState(false);
  const [lockEnabled, setLockEnabled] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const backgroundedAt = useRef<number | null>(null);

  // On mount: read the persisted lock preference and lock immediately if set.
  useEffect(() => {
    isAppLockEnabled().then(async (enabled) => {
      setLockEnabled(enabled);
      if (enabled) {
        const available = await isBiometricAvailable();
        if (available) setIsLocked(true);
      }
    });
  }, []);

  // Re-lock after returning from background if the app was away long enough.
  useEffect(() => {
    const sub = AppState.addEventListener('change', (state: AppStateStatus) => {
      if (state === 'background' || state === 'inactive') {
        backgroundedAt.current = Date.now();
      } else if (state === 'active' && lockEnabled) {
        const t = backgroundedAt.current;
        if (t !== null && Date.now() - t > LOCK_AFTER_BACKGROUND_MS) {
          isBiometricAvailable().then((available) => {
            if (available) setIsLocked(true);
          });
        }
        backgroundedAt.current = null;
      }
    });
    return () => sub.remove();
  }, [lockEnabled]);

  const unlock = useCallback(async () => {
    if (isAuthenticating) return;
    setIsAuthenticating(true);
    try {
      const success = await authenticateWithBiometric();
      if (success) setIsLocked(false);
    } finally {
      setIsAuthenticating(false);
    }
  }, [isAuthenticating]);

  return { isLocked, lockEnabled, unlock, isAuthenticating };
}
