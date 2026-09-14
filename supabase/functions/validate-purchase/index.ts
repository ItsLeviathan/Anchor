// Supabase Edge Function: validate-purchase
//
// Called by the client after any RevenueCat purchase or restore. Verifies
// subscription status by hitting the RevenueCat REST API with our secret key
// (so the client can't fake Pro status), then upserts the subscriptions row.
//
// Deploy with: supabase functions deploy validate-purchase
// Requires a secret: supabase secrets set REVENUECAT_SECRET_KEY=sk_...
//
// The subscriptions table has no client-side insert/update policy (see
// migration 0001_init.sql and 0008_monetization.sql). This function uses
// the service-role key via ctx.supabaseAdmin to write it — the only path.

import { withSupabase } from 'npm:@supabase/server@^1';

const REVENUECAT_API = 'https://api.revenuecat.com/v1';

export default {
  fetch: withSupabase({ auth: 'user' }, async (_req: Request, ctx: any) => {
    const userId = ctx.userClaims.id as string;
    const rcSecretKey = Deno.env.get('REVENUECAT_SECRET_KEY');

    if (!rcSecretKey) {
      console.error('REVENUECAT_SECRET_KEY is not configured');
      return Response.json({ error: 'Server misconfigured' }, { status: 500 });
    }

    // Fetch the subscriber record from RevenueCat. RevenueCat handles receipt
    // validation with Apple / Google — we just read the result.
    const rcRes = await fetch(`${REVENUECAT_API}/subscribers/${userId}`, {
      headers: {
        Authorization: `Bearer ${rcSecretKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (!rcRes.ok) {
      const body = await rcRes.text();
      console.error('RevenueCat API error', rcRes.status, body);
      return Response.json({ error: 'Could not verify subscription status' }, { status: 502 });
    }

    const { subscriber } = await rcRes.json();
    const proEntitlement = subscriber?.entitlements?.pro;
    const now = new Date().toISOString();

    // No active Pro entitlement — mark any existing active row as expired
    if (
      !proEntitlement ||
      !proEntitlement.expires_date ||
      new Date(proEntitlement.expires_date) <= new Date()
    ) {
      await ctx.supabaseAdmin
        .from('subscriptions')
        .update({ status: 'expired', updated_at: now })
        .eq('user_id', userId)
        .in('status', ['active', 'trialing', 'grace_period']);

      return Response.json({ isPro: false });
    }

    const isTrialing = proEntitlement.period_type === 'trial';
    const provider = proEntitlement.store === 'app_store' ? 'apple' : 'google';
    const status = isTrialing ? 'trialing' : 'active';

    // Upsert — the unique constraint on user_id (migration 0008) ensures this
    // updates the existing row rather than inserting a duplicate.
    const { error } = await ctx.supabaseAdmin.from('subscriptions').upsert(
      {
        user_id: userId,
        provider,
        product_id: proEntitlement.product_identifier,
        status,
        started_at: proEntitlement.original_purchase_date,
        expires_at: proEntitlement.expires_date,
        auto_renewing: !proEntitlement.unsubscribe_detected_at,
        updated_at: now,
      },
      { onConflict: 'user_id' }
    );

    if (error) {
      console.error('Failed to upsert subscription', error);
      return Response.json({ error: 'Failed to save subscription status' }, { status: 500 });
    }

    return Response.json({ isPro: true, status, expiresAt: proEntitlement.expires_date });
  }),
};
