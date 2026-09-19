import { useCallback, useEffect, useRef, useState } from 'react';

import { runBootstrap, type BootstrapResult } from './BootstrapManager';

export type BootstrapStatus = 'loading' | 'ready' | 'error';

interface BootstrapState {
  status: BootstrapStatus;
  result: BootstrapResult | null;
  error: string | null;
}

// Local SQLite init + a best-effort session restore should always finish in
// well under this. If it hasn't, something is genuinely stuck (not just a
// slow network — restoreSession() has its own shorter internal timeout and
// never blocks on it) and the user needs a way out rather than an infinite
// spinner.
const MAX_BOOTSTRAP_MS = 12_000;

/**
 * Drives Anchor's startup screen. `status` starts at 'loading' every time
 * `retry()` is called (or on first mount), moves to 'ready' once
 * `runBootstrap()` resolves, or to 'error' if it rejects (critical failure,
 * e.g. local database init itself failed) or overruns MAX_BOOTSTRAP_MS.
 */
export function useBootstrap() {
  const [state, setState] = useState<BootstrapState>({ status: 'loading', result: null, error: null });
  const attemptRef = useRef(0);

  const start = useCallback(() => {
    const thisAttempt = ++attemptRef.current;
    setState({ status: 'loading', result: null, error: null });

    const timeoutId = setTimeout(() => {
      if (attemptRef.current !== thisAttempt) return;
      setState({
        status: 'error',
        result: null,
        error: "This is taking longer than expected.",
      });
    }, MAX_BOOTSTRAP_MS);

    runBootstrap()
      .then((result) => {
        clearTimeout(timeoutId);
        if (attemptRef.current !== thisAttempt) return;
        setState({ status: 'ready', result, error: null });
      })
      .catch((err) => {
        clearTimeout(timeoutId);
        if (attemptRef.current !== thisAttempt) return;
        console.error('Bootstrap failed', err);
        const message = err instanceof Error ? err.message : "Something prevented Anchor from starting.";
        setState({ status: 'error', result: null, error: message });
      });
  }, []);

  useEffect(() => {
    start();
  }, [start]);

  return { status: state.status, error: state.error, retry: start };
}
