import type { Entitlements, Subscription } from './types';

/**
 * Centralized entitlement derivation.
 *
 * Per the monetization spec, features must check `entitlements.canUseX`
 * through this single service rather than scattering `if (user.isPro)`
 * checks throughout the UI. This function is pure and unit-testable; the
 * `useEntitlements` hook is the only thing that wires it up to live data.
 *
 * No billing integration exists yet in Phase 1 — this only establishes the
 * shape and the safe-default behavior (see isSubscriptionActive) that later
 * phases build real purchases on top of.
 */

const ACTIVE_STATUSES: Subscription['status'][] = ['trialing', 'active', 'grace_period'];

export const DEFAULT_FREE_AI_MONTHLY_LIMIT = 10;

// Placeholder only: the real Pro limit will itself be a remote-config value
// once AI features and billing exist (Phase 4 / Phase 7).
const PRO_AI_MONTHLY_LIMIT_PLACEHOLDER = 200;

export function isSubscriptionActive(subscription: Subscription | null): boolean {
  if (!subscription) return false;
  if (!ACTIVE_STATUSES.includes(subscription.status)) return false;
  if (subscription.expiresAt && new Date(subscription.expiresAt).getTime() < Date.now()) return false;
  return true;
}

export function deriveEntitlements(
  subscription: Subscription | null,
  freeAiMonthlyLimit: number = DEFAULT_FREE_AI_MONTHLY_LIMIT
): Entitlements {
  const isPro = isSubscriptionActive(subscription);

  return {
    isPro,
    canUseAdvancedAI: isPro,
    canUseSmartScheduling: isPro,
    canUseAdvancedInsights: isPro,
    canUseAdvancedWidgets: isPro,
    canStoreAdvancedDocuments: isPro,
    canUseAdvancedStudentMode: isPro,
    aiMonthlyLimit: isPro ? PRO_AI_MONTHLY_LIMIT_PLACEHOLDER : freeAiMonthlyLimit,
  };
}
