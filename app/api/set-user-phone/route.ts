// app/api/set-user-phone/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(req: NextRequest) {
  try {
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY || !process.env.NEXT_PUBLIC_SUPABASE_URL) {
      return NextResponse.json({ error: 'Server misconfiguration.' }, { status: 500 });
    }

    const { userId, phone } = await req.json();

    if (!userId || !phone) {
      return NextResponse.json({ error: 'userId and phone are required.' }, { status: 400 });
    }

    // Supabase expects E.164 format (e.g. +201096963387). Your signup form
    // already validates 11 raw digits (Egyptian mobile format), so prefix
    // with +20 here rather than trusting a client-supplied country code.
    const e164Phone = phone.startsWith('+') ? phone : `+20${phone.replace(/^0/, '')}`;

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    const { error } = await supabase.auth.admin.updateUserById(userId, {
      phone: e164Phone,
      phone_confirm: true, // skip SMS OTP verification — we already collected it via the form
    });

    if (error) {
      console.error('[set-user-phone]', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error('set-user-phone route crashed:', err);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}