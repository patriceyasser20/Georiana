'use server';

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

const FIRST_ORDER_CODE = 'FIRST10';
const PAYMOB_BASE = 'https://accept.paymob.com/api';

async function getSupabase() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
  );
}

async function verifyFirstOrderPromo(userId: string, promoCode: string, clientDiscountPct: number): Promise<number> {
  if (promoCode.toUpperCase() !== FIRST_ORDER_CODE) return 0;
  const supabase = await getSupabase();
  const { data: existing } = await supabase
    .from('promo_usage')
    .select('id')
    .eq('user_id', userId)
    .eq('promo_code', FIRST_ORDER_CODE)
    .maybeSingle();
  if (existing) return 0;
  return Math.min(clientDiscountPct, 10);
}

interface BillingInfo {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  street: string;
  apartment?: string;
  city: string;
}

export async function createPaymobPayment(
  total: number,
  items: any[],
  orderId: string,
  billing: BillingInfo,
  promoCode?: string,
  discountPct?: number
) {
  const supabase = await getSupabase();
  const { data: { user } } = await supabase.auth.getUser();

  let verifiedDiscountPct = 0;
  if (promoCode && user) {
    verifiedDiscountPct = await verifyFirstOrderPromo(user.id, promoCode, discountPct ?? 0);
  }

  // Recompute total server-side from what the client sent, applying only
  // the server-verified promo discount (same spirit as the Stripe version —
  // note: like the original, this still trusts client-supplied item prices
  // and doesn't re-verify offers/delivery; that's the separate hardening
  // task flagged earlier, unchanged here).
  const finalTotal = verifiedDiscountPct > 0
    ? total * (1 - verifiedDiscountPct / 100)
    : total;

  const amountCents = Math.round(finalTotal * 100);

  // ── Step 1: Auth ──────────────────────────────────────────────────────
  const authRes = await fetch(`${PAYMOB_BASE}/auth/tokens`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ api_key: process.env.PAYMOB_API_KEY }),
  });
  if (!authRes.ok) {
    console.error('Paymob auth failed:', authRes.status, await authRes.text());
    throw new Error('Paymob auth failed');
  }
  const { token: authToken } = await authRes.json();

  // ── Step 2: Register order ───────────────────────────────────────────
  const orderPayload = {
    auth_token: authToken,
    delivery_needed: false,
    amount_cents: amountCents,
    currency: 'EGP',
    // Paymob rejects a merchant_order_id it's already seen — but a
    // customer legitimately retrying a failed payment reuses the same
    // internal orderId. Suffix with a timestamp so each attempt is
    // unique to Paymob, while merchant_order_id still starts with the
    // real orderId so the webhook/success page can recover it.
    merchant_order_id: `${orderId}-${Date.now()}`,
    items: items.map((item) => ({
      name: item.name,
      amount_cents: Math.round(Number(item.price) * 100),
      quantity: item.quantity,
    })),
  };

  const orderRes = await fetch(`${PAYMOB_BASE}/ecommerce/orders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(orderPayload),
  });
  if (!orderRes.ok) {
    console.error('Paymob order registration failed:', orderRes.status, await orderRes.text());
    console.error('Payload sent:', JSON.stringify(orderPayload));
    throw new Error('Paymob order registration failed');
  }
  const { id: paymobOrderId } = await orderRes.json();

  // ── Step 3: Payment key ──────────────────────────────────────────────
  const keyRes = await fetch(`${PAYMOB_BASE}/acceptance/payment_keys`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      auth_token: authToken,
      amount_cents: amountCents,
      expiration: 3600,
      order_id: paymobOrderId,
      billing_data: {
        first_name: billing.firstName || 'NA',
        last_name: billing.lastName || 'NA',
        email: billing.email || 'na@na.com',
        phone_number: billing.phone || 'NA',
        street: billing.street || 'NA',
        building: 'NA',
        floor: 'NA',
        apartment: billing.apartment || 'NA',
        city: billing.city || 'NA',
        state: 'NA',
        country: 'EG',
        postal_code: 'NA',
        shipping_method: 'NA',
      },
      currency: 'EGP',
      integration_id: Number(process.env.PAYMOB_INTEGRATION_ID),
    }),
  });
  if (!keyRes.ok) {
    console.error('Paymob payment key request failed:', keyRes.status, await keyRes.text());
    throw new Error('Paymob payment key request failed');
  }
  const { token: paymentToken } = await keyRes.json();

  const url = `${PAYMOB_BASE}/acceptance/iframes/${process.env.PAYMOB_IFRAME_ID}?payment_token=${paymentToken}`;
  return { url };
}