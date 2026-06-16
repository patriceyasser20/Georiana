// app/api/admin-token/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  const body = await req.json();
  let userId: string | null = null;

  // Path A: Supabase session token (from OAuth or email login)
  if (body.token) {
    const { data: { user }, error } = await supabase.auth.getUser(body.token);
    if (error || !user) {
      return NextResponse.json({ error: 'Invalid session.' }, { status: 401 });
    }
    userId = user.id;
  }

  // Path B: email + password (fallback)
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

  // Check is_admin in profiles table
  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', userId)
    .single();

  if (!profile?.is_admin) {
    return NextResponse.json({ error: 'Not an admin.' }, { status: 403 });
  }

  return NextResponse.json({ token: process.env.ADMIN_SECRET });
}