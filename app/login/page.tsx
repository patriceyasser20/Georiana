'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { supabaseClient } from '../../lib/supabaseClient';
import { useTranslation } from '../context/LanguageContext';
import { Mail, Apple, Twitter } from 'lucide-react';

export default function Login() {
  const router = useRouter();
  const { t } = useTranslation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // ==================== SOCIAL LOGIN ====================
  const signInWithProvider = async (provider: 'google' | 'apple' | 'twitter') => {
    setLoading(true);
    setError('');

    const { error } = await supabaseClient.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) setError(error.message);
    setLoading(false);
  };

  // ==================== EMAIL LOGIN ====================
  const handleLogin = async () => {
    setLoading(true);
    setError('');

    // ADMIN LOGIN
    if (email.toLowerCase() === 'admin@zara.com' && password === 'admin2026') {
      localStorage.setItem('isAdmin', 'true');
      router.push('/admin');
      setLoading(false);
      return;
    }

    const { error: authError } = await supabaseClient.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      setError(t('login.invalidCredentials'));
    } else {
      router.push('/');
    }

    setLoading(false);
  };

  return (
    <>
      <Header />
      <div>GAP</div>
      <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12">
        <div className="bg-white rounded-3xl shadow-xl p-12 max-w-md w-full">
          <div className="text-center mb-10">
            <img 
              src="/images/logo.svg" 
              alt="GEORIANA" 
              className="h-30 mx-auto" 
            />
            <p className="text-xl text-gray-500 mt-4">{t('login.title')}</p>
          </div>

          {/* Email & Password Form */}
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
              className="border rounded-2xl px-6 py-4 w-full focus:outline-none focus:border-black"
            />

            {error && <p className="text-red-600 text-center font-medium">{error}</p>}

            <button
              onClick={handleLogin}
              disabled={loading}
              className="w-full bg-black text-white py-4 rounded-full text-sm tracking-widest hover:bg-gray-800 disabled:opacity-70 transition"
            >
              {loading ? t('common.processing') : t('login.button')}
            </button>
          </div>

          {/* ==================== SOCIAL LOGIN BUTTONS (NEW) ==================== */}
          <div className="my-8 relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-white px-4 text-gray-500">Or continue with</span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            {/* Google */}
            <button
              onClick={() => signInWithProvider('google')}
              disabled={loading}
              className="border border-gray-300 hover:bg-gray-50 py-3 rounded-2xl flex items-center justify-center gap-2 transition"
            >
              <img src="https://www.google.com/images/branding/googleg/1x/googleg_standard_color_24dp.png" alt="Google" className="w-6" />
            </button>

            {/* Apple */}
            <button
              onClick={() => signInWithProvider('apple')}
              disabled={loading}
              className="border border-gray-300 hover:bg-gray-50 py-3 rounded-2xl flex items-center justify-center gap-2 transition"
            >
              <Apple size={24} />
            </button>

            {/* X (Twitter) */}
            <button
              onClick={() => signInWithProvider('twitter')}
              disabled={loading}
              className="border border-gray-300 hover:bg-gray-50 py-3 rounded-2xl flex items-center justify-center gap-2 transition"
            >
              <Twitter size={24} />
            </button>
          </div>

          {/* Sign up link */}
          <div className="text-center mt-10 text-sm">
            {t('login.noAccount')}{' '}
            <span 
              onClick={() => router.push('/signup')} 
              className="text-black underline cursor-pointer"
            >
              {t('login.signUp')}
            </span>
          </div>

          {/* Admin hint */}
          <div className="text-center mt-6 text-xs text-gray-500">
            Admin Login: admin@zara.com / admin2026
          </div>
        </div>
      </div>
    </>
  );
}