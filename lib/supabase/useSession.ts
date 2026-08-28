import type { Session } from '@supabase/supabase-js';
import { useEffect, useState } from 'react';

import { supabase } from './client';

interface SessionState {
  session: Session | null;
  isLoading: boolean;
  error: string | null;
}

/**
 * Anchor never forces registration on first launch. This hook restores an
 * existing session if one exists, and otherwise starts an anonymous
 * Supabase session so the user can begin immediately. When they later
 * register (email/password, Google, Apple), Supabase's `linkIdentity`
 * flow upgrades this same user id in place — nothing here needs to change.
 */
export function useSession(): SessionState {
  const [state, setState] = useState<SessionState>({
    session: null,
    isLoading: true,
    error: null,
  });

  useEffect(() => {
    let mounted = true;

    async function init() {
      const { data: existing } = await supabase.auth.getSession();

      if (existing.session) {
        if (mounted) setState({ session: existing.session, isLoading: false, error: null });
        return;
      }

      const { data: anon, error } = await supabase.auth.signInAnonymously();

      if (!mounted) return;

      if (error) {
        setState({ session: null, isLoading: false, error: error.message });
        return;
      }

      setState({ session: anon.session, isLoading: false, error: null });
    }

    init();

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
