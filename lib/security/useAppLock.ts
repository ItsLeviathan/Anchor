import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, type AppStateStatus } from 'react-native';

import { authenticateWithBiometric, isAppLockEnabled } from './appLock';

// How long the app must be backgrounded before it re-locks (ms).
const LOCK_AFTER_BACKGROUND_MS = 15_000;

export function useAppLock() {
  const [isLocked, setIsLocked] = useState(false);
  const [lockEnabled, setLockEnabled] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [lastError, setLastError] = useState<string | null>(null);
  const backgroundedAt = useRef<number | null>(null);

  // On mount: read the persisted lock preference and lock immediately if set.
  //
  // Deliberately fail closed here: whether the device currently reports
  // biometrics as available is irrelevant to whether the screen should show.
  // Gating on `isBiometricAvailable()` (as this used to) meant that if
  // biometric enrollment was ever removed at the OS level, or that check
  // threw/returned false for any reason, the lock silently never appeared
  // and the app opened straight to user data. Now, if the user has enabled
  // app lock, the lock screen always shows; `authenticateWithBiometric`
  // (which itself fails closed) is what decides whether it goes away.
  useEffect(() => {
    isAppLockEnabled().then((enabled) => {
      setLockEnabled(enabled);
      if (enabled) setIsLocked(true);
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
          setIsLocked(true);
        }
        backgroundedAt.current = null;
      }
    });
    return () => sub.remove();
  }, [lockEnabled]);

  const unlock = useCallback(async () => {
    if (isAuthenticating) return;
    setIsAuthenticating(true);
    setLastError(null);
    try {
      const success = await authenticateWithBiometric();
      if (success) {
        setIsLocked(false);
      } else {
        setLastError('Authentication failed. Try again.');
      }
    } catch (err) {
      // authenticateWithBiometric already fails closed and shouldn't throw,
      // but guard here too so an unexpected error can never leave the app
      // unlocked, and so it's surfaced instead of swallowed.
      console.error('App lock unlock attempt failed', err);
      setLastError('Something went wrong. Try again.');
    } finally {
      setIsAuthenticating(false);
    }
  }, [isAuthenticating]);

  return { isLocked, lockEnabled, unlock, isAuthenticating, lastError };
}
