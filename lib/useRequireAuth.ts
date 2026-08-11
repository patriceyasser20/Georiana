'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabaseClient } from './supabaseClient';

// Redirects to /login if there's no active session on mount, and again
// whenever the session ends afterward — whether from an explicit sign-out
// or Supabase invalidating the session server-side (time-box / inactivity
// timeout configured in the dashboard).
export function useRequireAuth() {
  const router = useRouter();

  useEffect(() => {
    let mounted = true;

    const redirectIfUnauthenticated = async () => {
      const { data: { session } } = await supabaseClient.auth.getSession();
      if (mounted && !session) router.replace('/login');
    };
    redirectIfUnauthenticated();

    const { data: { subscription } } = supabaseClient.auth.onAuthStateChange((_event, session) => {
      if (mounted && !session) router.replace('/login');
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [router]);
}