'use server';

import Stripe from 'stripe';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20',
});

async function createOrGetStripeCustomer(userId: string, email: string) {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
  );

  const { data: profile } = await supabase
    .from('profiles')
    .select('stripe_customer_id')
    .eq('id', userId)
    .single();

  if (profile?.stripe_customer_id) return profile.stripe_customer_id;

  const existing = await stripe.customers.list({
    email: email,
    limit: 1,
  });

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

export async function createStripeCheckout(total: number, items: any[]) {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
  );

  const { data: { user } } = await supabase.auth.getUser();

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

  let customerId: string | undefined;
  if (user?.email) {
    customerId = await createOrGetStripeCustomer(user.id, user.email);
  }

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: items.map(item => ({
      price_data: {
        currency: 'usd',
        product_data: { name: item.name },
        unit_amount: Math.round(item.price * 100),
      },
      quantity: item.quantity,
    })),
    mode: 'payment',
    ...(customerId && { customer: customerId }),
    success_url: `${siteUrl}/checkout/success`,
    cancel_url: `${siteUrl}/checkout`,
  });

  return { url: session.url };
}