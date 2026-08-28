import { useQuery } from '@tanstack/react-query';

import { supabase } from '../supabase/client';
import { DEFAULT_FREE_AI_MONTHLY_LIMIT, deriveEntitlements } from './deriveEntitlements';
import type { Entitlements, Subscription } from './types';

async function fetchSubscription(userId: string): Promise<Subscription | null> {
  const { data, error } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  return {
    id: data.id,
    userId: data.user_id,
    provider: data.provider,
    productId: data.product_id,
    status: data.status,
    startedAt: data.started_at,
    expiresAt: data.expires_at,
    autoRenewing: data.auto_renewing,
  };
}

// Read from the remotely-configurable app_config table so the free AI limit
// can change without an app release, per the monetization spec. Falls back
// to the documented default (10) if offline or unset.
async function fetchFreeAiMonthlyLimit(): Promise<number> {
  const { data, error } = await supabase
    .from('app_config')
    .select('value')
    .eq('key', 'free_ai_monthly_limit')
    .maybeSingle();

  if (error || !data) return DEFAULT_FREE_AI_MONTHLY_LIMIT;

  const parsed = Number(data.value);
  return Number.isFinite(parsed) ? parsed : DEFAULT_FREE_AI_MONTHLY_LIMIT;
}

interface UseEntitlementsResult {
  entitlements: Entitlements;
  isLoading: boolean;
}

export function useEntitlements(userId: string | undefined): UseEntitlementsResult {
  const subscriptionQuery = useQuery({
    queryKey: ['subscription', userId],
    queryFn: () => fetchSubscription(userId as string),
    enabled: Boolean(userId),
  });

  const configQuery = useQuery({
    queryKey: ['app_config', 'free_ai_monthly_limit'],
    queryFn: fetchFreeAiMonthlyLimit,
    staleTime: 1000 * 60 * 60,
  });

  // Defaulting to the free tier (never Pro) on error/offline is the safe
  // direction to fail in: a network hiccup should never wrongly unlock or
  // wrongly lock a paid feature. It resolves to the correct state as soon
  // as connectivity returns.
  const entitlements = deriveEntitlements(subscriptionQuery.data ?? null, configQuery.data);

  return {
    entitlements,
    isLoading: subscriptionQuery.isLoading || configQuery.isLoading,
  };
}
