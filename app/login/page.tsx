'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Header from '../components/Header';
import { supabaseClient } from '../../lib/supabaseClient';
import { useTranslation } from '../context/LanguageContext';

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

export default function Login() {
  const router = useRouter();
  const { t } = useTranslation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [needsConfirmation, setNeedsConfirmation] = useState(false);

  const signInWithProvider = async (provider: 'google') => {
    setLoading(true);
    setError('');
    const { error } = await supabaseClient.auth.signInWithOAuth({
      provider:'google',
      options: { redirectTo: `${window.location.origin}/callback` },
    });
    if (error) setError(error.message);
    setLoading(false);
  };

  const handleLogin = async () => {
    setLoading(true);
    setError('');
    setSuccess('');
    setNeedsConfirmation(false);

    const { data, error: authError } = await supabaseClient.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      if (authError.message.includes('Email not confirmed')) {
        setNeedsConfirmation(true);
        setError(t('login.confirmEmailFirst'));
      } else {
        setError(t('login.invalidEmailOrPassword'));
      }
      setLoading(false);
      return;
    }

    if (data.session) {
      console.log('✅ Logged in as:', data.session.user.email);

      const res = await fetch('/api/admin-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: data.session.access_token }),
      });

      const result = await res.json();
      console.log('🔑 Admin check status:', res.status, result);

      if (res.ok) {
        localStorage.setItem('isAdmin', 'true');
        localStorage.setItem('adminToken', result.token);
        router.push('/admin');
        setLoading(false);
        return;
      }

      setSuccess(t('login.loginSuccessful'));
      router.push('/');
    }

    setLoading(false);
  };

  const resendConfirmation = async () => {
    if (!email) return;
    setLoading(true);
    const { error } = await supabaseClient.auth.resend({ type: 'signup', email });
    if (error) setError(error.message);
    else setSuccess(t('login.confirmationResent'));
    setLoading(false);
  };

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12">
        <div className="bg-white rounded-3xl shadow-xl p-12 max-w-md w-full">
          <div className="text-center mb-10">
            <img src="/images/logo.svg" alt="GEORIANA" className="h-30 mx-auto" />
            <p className="text-xl text-gray-500 mt-4">{t('login.title')}</p>
          </div>

          <div className="space-y-6">
            <input
              type="email"
              placeholder={t('login.email')}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="border rounded-2xl px-6 py-4 w-full focus:outline-none focus:border-black"
            />
            <input
              type="password"
              placeholder={t('login.password')}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
              className="border rounded-2xl px-6 py-4 w-full focus:outline-none focus:border-black"
            />

            {error && <p className="text-red-600 text-center font-medium">{error}</p>}
            {success && <p className="text-green-600 text-center font-medium">{success}</p>}

            {needsConfirmation && (
              <button onClick={resendConfirmation} disabled={loading} className="w-full text-sm text-blue-600 underline">
                 {t('login.resendConfirmation')}
              </button>
            )}

            <button
              onClick={handleLogin}
              disabled={loading}
              className="w-full bg-black text-white py-4 rounded-full text-sm tracking-widest hover:bg-gray-800 disabled:opacity-70 transition"
            >
              {loading ? t('common.processing') : t('login.button')}
            </button>
          </div>

          <div className="my-8 relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-white px-4 text-gray-500">{t('login.orContinueWith')}</span>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <button
              onClick={() => signInWithProvider('google')}
              disabled={loading}
              className="w-full border border-gray-300 hover:bg-gray-50 py-4 rounded-2xl flex items-center justify-center gap-3 transition"
            >
              <img src="https://www.google.com/images/branding/googleg/1x/googleg_standard_color_24dp.png" alt="Google" className="w-5" />
              <span className="text-sm font-medium text-gray-700">{t('login.continueWithGoogle')}</span>
            </button>
          </div>

          <div className="text-center mt-10 text-sm">
            {t('login.noAccount')}{' '}
            <span onClick={() => router.push('/signup')} className="text-black underline cursor-pointer">
              {t('login.signUp')}
            </span>
          </div>
        </div>
      </div>
    </>
  );
}