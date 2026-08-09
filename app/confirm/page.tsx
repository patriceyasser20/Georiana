'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Header from '../components/Header';
import { supabaseClient } from '../../lib/supabaseClient';

function ConfirmContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const tokenHash = searchParams.get('token_hash');
    const type = searchParams.get('type');

    if (!tokenHash || type !== 'signup') {
      setStatus('error');
      setMessage('Invalid confirmation link.');
      return;
    }

    const verify = async () => {
      const { data, error } = await supabaseClient.auth.verifyOtp({
        token_hash: tokenHash,
        type: 'signup',
      });

      if (error) {
        setStatus('error');
        setMessage(error.message);
        return;
      }

      if (data.user) {
        // Same profile upsert logic as your existing callback page — keep
        // these in sync since both are "just finished signing up" entry points.
        const { data: existing } = await supabaseClient
          .from('profiles')
          .select('id')
          .eq('id', data.user.id)
          .single();

        if (existing) {
          await supabaseClient.from('profiles').update({ email: data.user.email }).eq('id', data.user.id);
        } else {
          await supabaseClient.from('profiles').insert({
            id: data.user.id,
            email: data.user.email,
            phone: data.user.user_metadata?.phone || null,
          });
        }
      }

      setStatus('success');
      setTimeout(() => router.push('/'), 1500);
    };

    verify();
  }, [searchParams, router]);

  return (
    <>
      <Header />
      <div className="min-h-screen flex items-center justify-center px-6">
        <div className="text-center">
          {status === 'verifying' && (
            <>
              <div className="w-10 h-10 border-4 border-black border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-gray-500">Confirming your email...</p>
            </>
          )}
          {status === 'success' && (
            <>
              <h1 className="text-3xl font-light mb-3">✅ Email confirmed!</h1>
              <p className="text-gray-500">Redirecting you to Georiana...</p>
            </>
          )}
          {status === 'error' && (
            <>
              <h1 className="text-3xl font-light mb-3 text-red-600">Confirmation failed</h1>
              <p className="text-gray-500 mb-6">{message}</p>
              <p className="text-sm text-gray-400">
                This link may have already been used or expired. Try signing in — if your account
                still isn't confirmed, use "Resend confirmation email" on the login page.
              </p>
            </>
          )}
        </div>
      </div>
    </>
  );
}

export default function Confirm() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="animate-spin w-10 h-10 border-4 border-black border-t-transparent rounded-full" /></div>}>
      <ConfirmContent />
    </Suspense>
  );
}