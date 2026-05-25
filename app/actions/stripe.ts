'use server';

import Stripe from 'stripe';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

// ─── Stripe client ────────────────────────────────────────────────────────────
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20',
});

// ─── Constants ────────────────────────────────────────────────────────────────
const FIRST_ORDER_CODE = 'FIRST10';

// ─── Supabase helper ──────────────────────────────────────────────────────────
// Builds a server-side Supabase client using your existing @supabase/ssr pattern.
async function getSupabase() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
  );
}

// ─── Create or retrieve a Stripe Customer for the logged-in user ──────────────
async function createOrGetStripeCustomer(userId: string, email: string) {
  const supabase = await getSupabase();

  const { data: profile } = await supabase
    .from('profiles')
    .select('stripe_customer_id')
    .eq('id', userId)
    .single();

  if (profile?.stripe_customer_id) return profile.stripe_customer_id;

  const existing = await stripe.customers.list({ email, limit: 1 });

  if (existing.data.length > 0) {
    await supabase
      .from('profiles')
      .upsert({ id: userId, stripe_customer_id: existing.data[0].id, email });
    return existing.data[0].id;
  }

  const customer = await stripe.customers.create({
    email,
    metadata: { supabase_user_id: userId },
  });

  await supabase
    .from('profiles')
    .upsert({ id: userId, stripe_customer_id: customer.id, email });

  return customer.id;
}

// ─── Server-side promo validation ────────────────────────────────────────────
// Re-checks the promo_usage table on the server so the discount can never be
// replayed by a client that skips the /api/promo/validate step.
// Returns the verified discount percentage (0 if the code is invalid / already used).
async function verifyFirstOrderPromo(
  userId: string,
  promoCode: string,
  clientDiscountPct: number
): Promise<number> {
  if (promoCode.toUpperCase() !== FIRST_ORDER_CODE) return 0;

  const supabase = await getSupabase();

  const { data: existing } = await supabase
    .from('promo_usage')
    .select('id')
    .eq('user_id', userId)
    .eq('promo_code', FIRST_ORDER_CODE)
    .maybeSingle();

  // Already used → no discount, even if the client passed one
  if (existing) return 0;

  // Trust the percentage the checkout page computed (always 10 for FIRST10),
  // but cap it for safety so a tampered client can't send 99.
  return Math.min(clientDiscountPct, 10);
}

// ─── Main export: create a Stripe Checkout session ───────────────────────────
//
// Signature is backward-compatible:
//   createStripeCheckout(total, items)              ← existing callers unchanged
//   createStripeCheckout(total, items, promoCode, discountPct)  ← new promo path
//
export async function createStripeCheckout(
  total: number,
  items: any[],
  promoCode?: string,      // only set when a first-order promo was applied
  discountPct?: number     // the percentage shown to the user on the checkout page
) {
  const supabase = await getSupabase();
  const { data: { user } } = await supabase.auth.getUser();

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

  // ── Customer ID ─────────────────────────────────────────────────────────────
  let customerId: string | undefined;
  if (user?.email) {
    customerId = await createOrGetStripeCustomer(user.id, user.email);
  }

  // ── Server-side promo re-validation ─────────────────────────────────────────
  // Default to 0 (no discount). Only bumped up when FIRST10 passes the DB check.
  let verifiedDiscountPct = 0;
  if (promoCode && user) {
    verifiedDiscountPct = await verifyFirstOrderPromo(
      user.id,
      promoCode,
      discountPct ?? 0
    );
  }

  // ── Line items — apply discount proportionally to each item's unit price ────
  const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = items.map(item => {
    const baseAmount = Math.round(Number(item.price) * 100); // cents
    const unitAmount = verifiedDiscountPct > 0
      ? Math.round(baseAmount * (1 - verifiedDiscountPct / 100))
      : baseAmount;

    return {
      price_data: {
        currency: 'usd',
        product_data: { name: item.name },
        unit_amount: unitAmount,
      },
      quantity: item.quantity,
    };
  });

  // ── Create session ───────────────────────────────────────────────────────────
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: lineItems,
    mode: 'payment',
    ...(customerId && { customer: customerId }),
    success_url: `${siteUrl}/checkout/success`,
    cancel_url: `${siteUrl}/checkout`,
    // Metadata is read by the webhook to record promo usage after payment
    metadata: {
      userId:      user?.id ?? '',
      promoCode:   verifiedDiscountPct > 0 ? (promoCode ?? '').toUpperCase() : '',
      discountPct: String(verifiedDiscountPct),
    },
  });

  return { url: session.url };
}