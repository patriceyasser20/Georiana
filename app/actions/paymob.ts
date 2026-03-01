// app/actions/paymob.ts
'use server';

import axios from 'axios';


const PAYMOB_API_KEY = process.env.PAYMOB_API_KEY?.trim();
const PAYMOB_INTEGRATION_ID = process.env.PAYMOB_INTEGRATION_ID?.trim();
const PAYMOB_IFRAME_ID = process.env.PAYMOB_IFRAME_ID?.trim();

const PAYMOB_API_URL = 'https://accept.paymob.com/api';

export async function createPaymobOrder(amount: number, items: any[]) {
  console.log('createPaymobOrder called with amount:', amount);
  console.log('Env vars check:');
  console.log('  API_KEY exists?', !!PAYMOB_API_KEY);
  console.log('  INTEGRATION_ID exists?', !!PAYMOB_INTEGRATION_ID);
  console.log('  IFRAME_ID exists?', !!PAYMOB_IFRAME_ID);

  if (!PAYMOB_API_KEY) throw new Error('PAYMOB_API_KEY missing');
  if (!PAYMOB_INTEGRATION_ID) throw new Error('PAYMOB_INTEGRATION_ID missing');
  if (!PAYMOB_IFRAME_ID) throw new Error('PAYMOB_IFRAME_ID missing');

  try {
    console.log('Step 1: Getting auth token...');
    const authRes = await axios.post(`${PAYMOB_API_URL}/auth/tokens`, {
      api_key: PAYMOB_API_KEY,
    });
    const authToken = authRes.data.token;
    console.log('Auth token received');

    console.log('Step 2: Creating order...');
    const orderRes = await axios.post(
      `${PAYMOB_API_URL}/ecommerce/orders`,
      {
        auth_token: authToken,
        delivery_needed: false,
        amount_cents: Math.round(amount * 100),
        currency: 'EGP',
        items,
      },
      { headers: { Authorization: `Bearer ${authToken}` } }
    );
    const orderId = orderRes.data.id;
    console.log('Order created, ID:', orderId);

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
      },
      { headers: { Authorization: `Bearer ${authToken}` } }
    );

    const paymentKey = paymentRes.data.token;
    console.log('Payment key received');

    const iframeUrl = `https://accept.paymob.com/api/acceptance/iframes/${PAYMOB_IFRAME_ID}?payment_token=${paymentKey}`;
    console.log('Iframe URL generated:', iframeUrl);

    return {
      paymentKey,
      orderId,
      iframeUrl,
    };
  } catch (error: any) {
    console.error('Paymob request failed:', {
      message: error.message,
      responseData: error.response?.data,
      status: error.response?.status,
      config: error.config?.url,
    });
    throw new Error(
      `Paymob failed: ${error.response?.data?.message || error.message || 'Unknown error'}`
    );
  }
}