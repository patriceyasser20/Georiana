'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabaseClient } from '../../lib/supabaseClient';

export default function Callback() {
  const router = useRouter();

  useEffect(() => {
    const handleCallback = async () => {
      // Exchange the OAuth code for a session
      const { data, error } = await supabaseClient.auth.getSession();

      if (error) {
        console.error('OAuth callback error:', error);
        router.push('/login?error=oauth_failed');
        return;
      }

      if (data.session) {
        // Upsert profile for social login users (no phone required)
        const user = data.session.user;
        await supabaseClient.from('profiles').upsert({
          id: user.id,
          email: user.email,
          phone: user.user_metadata?.phone || null,
        });

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