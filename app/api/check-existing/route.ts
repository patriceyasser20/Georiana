import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(req: NextRequest) {
  try {
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY || !process.env.NEXT_PUBLIC_SUPABASE_URL) {
      return NextResponse.json({ error: 'Server misconfiguration.' }, { status: 500 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    const { email, phone } = await req.json();

    const [{ data: existingEmail }, { data: existingPhone }] = await Promise.all([
      email
        ? supabase.from('profiles').select('email').eq('email', email).maybeSingle()
        : Promise.resolve({ data: null }),
      phone
        ? supabase.from('profiles').select('phone').eq('phone', phone).maybeSingle()
        : Promise.resolve({ data: null }),
    ]);

    return NextResponse.json({
      emailExists: !!existingEmail,
      phoneExists: !!existingPhone,
    });
  } catch (err: any) {
    console.error('check-existing route crashed:', err);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}