import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function unsubscribeToken(email: string) {
  return crypto
    .createHmac('sha256', process.env.UNSUBSCRIBE_SECRET!)
    .update(email.toLowerCase())
    .digest('hex');
}

export async function GET(req: NextRequest) {
  const email = req.nextUrl.searchParams.get('email');
  const token = req.nextUrl.searchParams.get('token');

  if (!email || !token || unsubscribeToken(email) !== token) {
    return new NextResponse('Invalid or expired unsubscribe link.', { status: 400 });
  }

  await supabase.from('profiles').update({ marketing_opt_out: true }).eq('email', email);

  return new NextResponse(
    `<html><body style="font-family:sans-serif;text-align:center;padding:60px;"><h2>You've been unsubscribed</h2><p>${email} will no longer receive marketing emails from Georiana.</p></body></html>`,
    { headers: { 'Content-Type': 'text/html' } }
  );
}