import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Paymob's HMAC covers these exact fields, in this exact order — not
// negotiable, this order is fixed by Paymob's spec.
const HMAC_FIELDS = [
  'amount_cents', 'created_at', 'currency', 'error_occured',
  'has_parent_transaction', 'id', 'integration_id', 'is_3d_secure',
  'is_auth', 'is_capture', 'is_refunded', 'is_standalone_payment',
  'is_voided', 'order.id', 'owner', 'pending', 'source_data.pan',
  'source_data.sub_type', 'source_data.type', 'success',
];

function getNested(obj: any, path: string) {
  return path.split('.').reduce((acc, key) => acc?.[key], obj);
}

function verifyHmac(obj: any, receivedHmac: string): boolean {
  const concatenated = HMAC_FIELDS.map((field) => String(getNested(obj, field))).join('');
  const computed = crypto
    .createHmac('sha512', process.env.PAYMOB_HMAC_SECRET!)
    .update(concatenated)
    .digest('hex');
  return computed === receivedHmac;
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const receivedHmac = req.nextUrl.searchParams.get('hmac');
  const obj = body.obj;

  if (!obj || !receivedHmac || !verifyHmac(obj, receivedHmac)) {
    console.error('Paymob webhook: HMAC verification failed');
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }

  // merchant_order_id is "{realOrderId}-{timestamp}" — strip the suffix
  // to get back the actual orders.id UUID.
  const rawMerchantOrderId = obj.order?.merchant_order_id as string | undefined;
  const orderId = rawMerchantOrderId?.replace(/-\d+$/, '');
  const success = obj.success === true;

  if (!orderId) {
    console.error('Paymob webhook: no merchant_order_id in payload');
    return NextResponse.json({ received: true });
  }

  if (success) {
    const { error } = await supabase
      .from('orders')
      .update({ status: 'succeeded' })
      .eq('id', orderId);

    if (error) {
      console.error('Failed to update order from Paymob webhook:', error);
      return NextResponse.json({ error: 'DB update failed' }, { status: 500 });
    }

    await supabase.functions.invoke('bright-responder', { body: { order_id: orderId } })
      .catch(err => console.error('Email sending failed:', err));
  } else {
    await supabase.from('orders').update({ status: 'failed' }).eq('id', orderId);
  }

  return NextResponse.json({ received: true });
}