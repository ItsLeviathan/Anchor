import type { Session } from '@supabase/supabase-js';
import { useEffect, useState } from 'react';

import { getBootstrapResult, runBootstrap } from '../bootstrap/BootstrapManager';
import { supabase } from './client';

interface SessionState {
  session: Session | null;
  isLoading: boolean;
  error: string | null;
}

function initialState(): SessionState {
  const cached = getBootstrapResult();
  if (cached) {
    return { session: cached.session, isLoading: false, error: cached.sessionError };
  }
  return { session: null, isLoading: true, error: null };
}

/**
 * Anchor never forces registration on first launch. Session restoration
 * itself happens once, in the app's bootstrap sequence (see
 * lib/bootstrap/BootstrapManager.ts), which either restores an existing
 * session or starts an anonymous one. By the time the main app renders,
 * bootstrap has already resolved, so this hook's initial state is correct
 * on the very first render — no loading flicker, no second sign-in call.
 *
 * It falls back to running bootstrap itself if it somehow renders before
 * that (e.g. a screen used outside the normal app-shell gating, or in
 * tests) - runBootstrap() is idempotent, so this can never duplicate work.
 *
 * When the user later registers (email/password, Google, Apple), Supabase's
 * `linkIdentity` flow upgrades this same user id in place — nothing here
 * needs to change.
 */
export function useSession(): SessionState {
  const [state, setState] = useState<SessionState>(initialState);

  useEffect(() => {
    let mounted = true;

    if (!getBootstrapResult()) {
      runBootstrap()
        .then((result) => {
          if (mounted) setState({ session: result.session, isLoading: false, error: result.sessionError });
        })
        .catch((err) => {
          // A thrown error here must still resolve isLoading - every screen
          // in the app gates its own loading state on isSessionLoading, so
          // leaving it true forever would strand the whole app on a spinner.
          console.error('Session initialization failed', err);
          if (mounted) {
            const message = err instanceof Error ? err.message : 'Failed to start a session.';
            setState({ session: null, isLoading: false, error: message });
          }
        });
    }

    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      if (mounted) {
        setState((prev) => ({ ...prev, session: newSession }));
      }
    });

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  return state;
}
