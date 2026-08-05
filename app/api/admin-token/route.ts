// app/api/admin-token/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(req: NextRequest) {
  try {
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY || !process.env.NEXT_PUBLIC_SUPABASE_URL) {
      console.error('Missing Supabase env vars in admin-token route');
      return NextResponse.json({ error: 'Server misconfiguration.' }, { status: 500 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    const body = await req.json();
    let userId: string | null = null;

    if (body.token) {
      const { data: { user }, error } = await supabase.auth.getUser(body.token);
      if (error || !user) {
        return NextResponse.json({ error: 'Invalid session.' }, { status: 401 });
      }
      userId = user.id;
    }

    if (!userId && body.email && body.password) {
      const { data: { session }, error } = await supabase.auth.signInWithPassword({
        email: body.email,
        password: body.password,
      });
      if (error || !session) {
        return NextResponse.json({ error: 'Invalid credentials.' }, { status: 401 });
      }
      userId = session.user.id;
    }

    if (!userId) {
      return NextResponse.json({ error: 'No credentials provided.' }, { status: 400 });
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', userId)
      .single();

    if (profileError) {
      console.error('Profile lookup failed:', profileError);
    }

    if (!profile?.is_admin) {
      return NextResponse.json({ error: 'Not an admin.' }, { status: 403 });
    }

    if (!process.env.ADMIN_SECRET) {
      console.error('Missing ADMIN_SECRET env var');
      return NextResponse.json({ error: 'Server misconfiguration.' }, { status: 500 });
    }

    return NextResponse.json({ token: process.env.ADMIN_SECRET });
  } catch (err: any) {
    console.error('admin-token route crashed:', err);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}