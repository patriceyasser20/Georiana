// import { headers } from 'next/headers';
// import Stripe from 'stripe';

// const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

// export async function POST(req: Request) {
//   const body = await req.text();
//   const signature = headers().get('stripe-signature')!;

//   let event: Stripe.Event;

//   try {
//     event = stripe.webhooks.constructEvent(
//       body,
//       signature,
//       process.env.STRIPE_WEBHOOK_SECRET!
//     );
//   } catch (err) {
//     return new Response(JSON.stringify({ error: 'Invalid signature' }), {
//       status: 400,
//     });
//   }

//   switch (event.type) {
//     case 'checkout.session.completed': {
//       const session = event.data.object;
//       // Handle successful payment — save order to your database
//       console.log('Payment success:', session.id);
//       break;
//     }
//   }

//   return new Response(JSON.stringify({ received: true }));
// }