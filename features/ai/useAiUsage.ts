import { useQuery } from '@tanstack/react-query';

import { supabase } from '../../lib/supabase/client';
import { useEntitlements } from '../../lib/entitlements/useEntitlements';

async function fetchAiUsageThisMonth(userId: string): Promise<number> {
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const { count, error } = await supabase
    .from('ai_usage')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .gte('created_at', startOfMonth.toISOString());

  if (error) throw error;
  return count ?? 0;
}

export function useAiUsageThisMonth(userId: string | undefined) {
  return useQuery({
    queryKey: ['ai_usage_count', userId],
    queryFn: () => fetchAiUsageThisMonth(userId as string),
    enabled: Boolean(userId),
    staleTime: 1000 * 30,
  });
}

/**
 * Display-only. The Edge Function re-derives entitlements and counts usage
 * itself before ever calling the AI provider - this hook exists so the UI
 * can show "3 left this month" without waiting for a request to fail.
 */
export function useRemainingAiActions(userId: string | undefined) {
  const { entitlements, isLoading: isEntitlementsLoading } = useEntitlements(userId);
  const { data: used = 0, isLoading: isUsageLoading } = useAiUsageThisMonth(userId);

  return {
    remaining: Math.max(entitlements.aiMonthlyLimit - used, 0),
    limit: entitlements.aiMonthlyLimit,
    used,
    isLoading: isEntitlementsLoading || isUsageLoading,
  };
}
