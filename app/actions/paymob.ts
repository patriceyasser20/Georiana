// app/actions/paymob.ts
'use server';

import axios from 'axios';

const PAYMOB_API_KEY = process.env.PAYMOB_API_KEY?.trim();
const PAYMOB_INTEGRATION_ID = process.env.PAYMOB_INTEGRATION_ID?.trim();
const PAYMOB_IFRAME_ID = process.env.PAYMOB_IFRAME_ID?.trim();

const PAYMOB_API_URL = 'https://accept.paymob.com/api';

export async function createPaymobOrder(amount: number, items: any[]) {
  console.log('🔹 Starting Paymob order creation...');
  console.log('   Total amount:', amount);
  console.log('   Items received:', items);

  if (!PAYMOB_API_KEY || !PAYMOB_INTEGRATION_ID || !PAYMOB_IFRAME_ID) {
    throw new Error('❌ Paymob credentials missing in .env.local');
  }

  try {
    // 1. Auth token
    console.log('Step 1: Getting auth token...');
    const authRes = await axios.post(`${PAYMOB_API_URL}/auth/tokens`, {
      api_key: PAYMOB_API_KEY,
    });
    const authToken = authRes.data.token;
    console.log('✅ Auth token OK');

    // 2. Create order - FIX items format here
    const formattedItems = items.map(item => ({
      name: item.name,
      amount_cents: Math.round(item.price * 100),   // ← Paymob requires this
      quantity: item.quantity || 1,
    }));

    console.log('Step 2: Creating order with formatted items...');
    const orderRes = await axios.post(
      `${PAYMOB_API_URL}/ecommerce/orders`,
      {
        auth_token: authToken,
        delivery_needed: false,
        amount_cents: Math.round(amount * 100),
        currency: 'EGP',
        items: formattedItems,
      }
    );
    const orderId = orderRes.data.id;
    console.log('✅ Order created, ID:', orderId);

    // 3. Payment key
    console.log('Step 3: Getting payment key...');
    const paymentRes = await axios.post(
      `${PAYMOB_API_URL}/acceptance/payment_keys`,
      {
        auth_token: authToken,
        amount_cents: Math.round(amount * 100),
        expiration: 3600,
        order_id: orderId,
        currency: 'EGP',
        integration_id: PAYMOB_INTEGRATION_ID,
        billing_data: {
          email: 'test@example.com',
          first_name: 'Test',
          last_name: 'User',
          phone_number: '01234567890',
          apartment: '1',
          floor: '1',
          street: 'Test St',
          building: '1',
          city: 'Giza',
          country: 'EGY',
          state: 'Giza',
        },
      }
    );

    const paymentKey = paymentRes.data.token;
    console.log('✅ Payment key received');

    const iframeUrl = `https://accept.paymob.com/api/acceptance/iframes/${PAYMOB_IFRAME_ID}?payment_token=${paymentKey}`;
    console.log('✅ Iframe URL ready');

    return { iframeUrl };

  } catch (error: any) {
    console.error('🚨 PAYMOB FULL ERROR (status 500):');
    console.error('   Status:', error.response?.status);
    console.error('   Full response data:', JSON.stringify(error.response?.data, null, 2));
    console.error('   Message:', error.message);

    const errorMsg = error.response?.data?.message 
      || error.response?.data?.detail 
      || JSON.stringify(error.response?.data) 
      || error.message 
      || 'Unknown Paymob error';

    throw new Error(`Paymob failed: ${errorMsg}`);
  }
}