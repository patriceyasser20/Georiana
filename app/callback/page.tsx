'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabaseClient } from '../../lib/supabaseClient';

async function checkAndSetAdmin(accessToken: string): Promise<boolean> {
  const res = await fetch('/api/admin-token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token: accessToken }),
  });
  if (!res.ok) return false;
  const data = await res.json();
  localStorage.setItem('isAdmin', 'true');
  localStorage.setItem('adminToken', data.token);
  return true;
}

export default function Callback() {
  const router = useRouter();

  useEffect(() => {
    const handleCallback = async () => {
      const { data, error } = await supabaseClient.auth.getSession();

      if (error) {
        console.error('OAuth callback error:', error);
        router.push('/login?error=oauth_failed');
        return;
      }

      if (data.session) {
        const user = data.session.user;

        // ── Update profile WITHOUT touching is_admin ──────────────────────────
        // We use update instead of upsert to avoid overwriting is_admin = true
        const { data: existing } = await supabaseClient
          .from('profiles')
          .select('id')
          .eq('id', user.id)
          .single();

        if (existing) {
          // Row exists — only update safe fields, never touch is_admin
          await supabaseClient
            .from('profiles')
            .update({ email: user.email })
            .eq('id', user.id);
        } else {
          // New user — insert without is_admin (defaults to false)
          await supabaseClient
            .from('profiles')
            .insert({ id: user.id, email: user.email, phone: user.user_metadata?.phone || null });
        }

        // ── Check admin status ────────────────────────────────────────────────
       // ── Check admin status ────────────────────────────────────────────────
        const isAdmin = await checkAndSetAdmin(data.session.access_token);
        if (isAdmin) {
          router.push('/admin');
          return;
        }

        // Not an admin — clear any stale admin flag from a previous
        // session on this same browser.
        localStorage.removeItem('isAdmin');
        localStorage.removeItem('adminToken');
        router.push('/');
      } else {
        router.push('/login');
      }
    };

    handleCallback();
  }, [router]);

  return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="text-center space-y-4">
        <div className="w-10 h-10 border-4 border-black border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-gray-500 text-sm tracking-widest">Signing you in...</p>
      </div>
    </div>
  );
}