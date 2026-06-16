import { headers } from 'next/headers';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  const body = await req.text();
  const signature = (await headers()).get('stripe-signature')!;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Invalid signature' }), {
      status: 400,
    });
  }

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;
      const orderId = session.metadata?.orderId;

      if (orderId) {
        const { error } = await supabase
          .from('orders')
          .update({ status: 'succeeded' })
          .eq('id', orderId);

        if (error) {
          console.error('Failed to update order status from webhook:', error);
          return new Response(JSON.stringify({ error: 'DB update failed' }), {
            status: 500,
          });
        }

        await supabase.functions.invoke('resend-email', {
          body: { order_id: orderId },
        }).catch(err => console.error('Email sending failed:', err));
      } else {
        console.error('No orderId in session metadata:', session.id);
      }
      break;
    }
  }

  return new Response(JSON.stringify({ received: true }));
}