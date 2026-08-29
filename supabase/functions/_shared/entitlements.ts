// Mirrors lib/entitlements/deriveEntitlements.ts on the client, but this
// is the copy that actually matters: the client's entitlements are a UX
// hint, this is the enforcement point. Duplicating the small amount of
// logic here (rather than trying to share a module across the Expo app
// and a Deno edge function) keeps each side simple and independently
// readable, at the cost of needing to keep the two in sync by hand if the
// business rule ever changes.

const ACTIVE_STATUSES = ['trialing', 'active', 'grace_period'];
const DEFAULT_FREE_MONTHLY_LIMIT = 10;
// Placeholder, matching the client - the real Pro limit becomes its own
// remote-config value once billing exists for real.
const PRO_MONTHLY_LIMIT = 200;

// Minimal shape of the supabase-js client needed here, so this file
// doesn't need to import the full SDK types.
interface QueryableSupabase {
  from: (table: string) => {
    select: (columns: string, options?: { count?: 'exact'; head?: boolean }) => {
      eq: (column: string, value: unknown) => any;
    };
  };
}

export interface QuotaResult {
  allowed: boolean;
  limit: number;
  used: number;
}

export async function checkAiQuota(supabase: QueryableSupabase, userId: string): Promise<QuotaResult> {
  const { data: subscription } = await (supabase.from('subscriptions') as any)
    .select('status, expires_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  const isPro =
    Boolean(subscription) &&
    ACTIVE_STATUSES.includes(subscription.status) &&
    (!subscription.expires_at || new Date(subscription.expires_at).getTime() >= Date.now());

  const { data: configRow } = await (supabase.from('app_config') as any)
    .select('value')
    .eq('key', 'free_ai_monthly_limit')
    .maybeSingle();

  const freeLimit = configRow ? Number(configRow.value) || DEFAULT_FREE_MONTHLY_LIMIT : DEFAULT_FREE_MONTHLY_LIMIT;
  const limit = isPro ? PRO_MONTHLY_LIMIT : freeLimit;

  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const { count } = await (supabase.from('ai_usage') as any)
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .gte('created_at', startOfMonth.toISOString());

  const used = count ?? 0;

  return { allowed: used < limit, limit, used };
}
