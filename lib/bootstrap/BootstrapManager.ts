import type { Session } from '@supabase/supabase-js';

import { initDatabase } from '../database/db';
import { supabase } from '../supabase/client';

/**
 * Anchor's one-time startup sequence.
 *
 * Two kinds of work happen here, and they are NOT treated the same way:
 *
 * - Local database init/migrations is CRITICAL. The app cannot safely render
 *   any screen without it (every screen reads/writes local SQLite), so a
 *   failure here fails the whole bootstrap and surfaces a recovery screen.
 *
 * - Session restoration is BEST-EFFORT. Anchor already supports a fully
 *   local, sessionless-until-synced experience, so a slow or offline network
 *   must never strand the user on a startup screen — restoreSession() always
 *   resolves (never throws), degrading to `session: null` on failure/timeout.
 */

export interface BootstrapResult {
  session: Session | null;
  sessionError: string | null;
}

const SESSION_RESTORE_TIMEOUT_MS = 6000;

let bootstrapPromise: Promise<BootstrapResult> | null = null;
let cachedResult: BootstrapResult | null = null;

function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => {
      setTimeout(() => reject(new Error(`${label} timed out`)), ms);
    }),
  ]);
}

async function restoreSession(): Promise<BootstrapResult> {
  try {
    const { data: existing } = await withTimeout(
      supabase.auth.getSession(),
      SESSION_RESTORE_TIMEOUT_MS,
      'Session restore'
    );

    if (existing.session) {
      return { session: existing.session, sessionError: null };
    }

    const { data: anon, error } = await withTimeout(
      supabase.auth.signInAnonymously(),
      SESSION_RESTORE_TIMEOUT_MS,
      'Anonymous sign-in'
    );

    if (error) {
      return { session: null, sessionError: error.message };
    }
    return { session: anon.session, sessionError: null };
  } catch (err) {
    // Never fatal: the rest of the app already treats `session: null` as a
    // valid, usable (offline/anonymous) state.
    const message = err instanceof Error ? err.message : 'Could not restore your session.';
    console.error('Bootstrap: session restore failed', err);
    return { session: null, sessionError: message };
  }
}

/**
 * Runs bootstrap exactly once; every caller (however many components mount
 * and call this) shares the same in-flight/completed promise, so there is
 * never a duplicate `initDatabase()` or duplicate sign-in call.
 */
export function runBootstrap(): Promise<BootstrapResult> {
  if (bootstrapPromise) return bootstrapPromise;

  bootstrapPromise = (async () => {
    try {
      await initDatabase();
    } catch (err) {
      // Reset so a user-initiated retry actually re-attempts init instead of
      // replaying the same rejected promise forever.
      bootstrapPromise = null;
      throw err;
    }

    const result = await restoreSession();
    cachedResult = result;
    return result;
  })();

  return bootstrapPromise;
}

/** Synchronously available only once runBootstrap() has resolved at least once. */
export function getBootstrapResult(): BootstrapResult | null {
  return cachedResult;
}
