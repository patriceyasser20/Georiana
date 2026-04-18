'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { supabaseClient } from '../../lib/supabaseClient';

export default function AuthCallback() {
  const router = useRouter();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const { error } = await supabaseClient.auth.getSession();

        if (error) {
          setStatus('error');
          setMessage('Failed to confirm your email. Please try again.');
          return;
        }

        setStatus('success');
        setMessage('🎉 Your email has been successfully confirmed!');

        // Redirect to home after 3 seconds
        setTimeout(() => {
          router.push('/');
        }, 3000);
      } catch (err) {
        setStatus('error');
        setMessage('Something went wrong. Please try logging in manually.');
      }
    };

    handleCallback();
  }, [router]);

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12">
        <div className="bg-white rounded-3xl shadow-xl p-12 max-w-md w-full text-center">
          {status === 'loading' && (
            <>
              <div className="animate-spin w-12 h-12 border-4 border-black border-t-transparent rounded-full mx-auto mb-6"></div>
              <h2 className="text-2xl font-light">Confirming your email...</h2>
            </>
          )}

          {status === 'success' && (
            <>
              <div className="text-6xl mb-6">🎉</div>
              <h2 className="text-3xl font-light mb-3">Email Confirmed!</h2>
              <p className="text-gray-600 mb-8">{message}</p>
              <p className="text-sm text-gray-500">You will be redirected to the homepage shortly...</p>
            </>
          )}

          {status === 'error' && (
            <>
              <div className="text-6xl mb-6">❌</div>
              <h2 className="text-3xl font-light mb-3">Confirmation Failed</h2>
              <p className="text-red-600 mb-8">{message}</p>
              <button
                onClick={() => router.push('/login')}
                className="bg-black text-white px-8 py-3 rounded-full text-sm tracking-widest"
              >
                Go to Login
              </button>
            </>
          )}
        </div>
      </div>
    </>
  );
}