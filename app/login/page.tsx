'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { supabaseClient } from '../../lib/supabaseClient';
import { useTranslation } from '../context/LanguageContext';
import { Mail } from 'lucide-react';

export default function Login() {
  const router = useRouter();
  const { t } = useTranslation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [needsConfirmation, setNeedsConfirmation] = useState(false);

  // ==================== SOCIAL LOGIN ====================
  const signInWithProvider = async (provider: 'google' | 'instagram' | 'tiktok') => {
    setLoading(true);
    setError('');
    setSuccess('');

    const { error } = await supabaseClient.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/callback`,
      },
    });

    if (error) setError(error.message);
    setLoading(false);
  };

  // ==================== EMAIL LOGIN ====================
  const handleLogin = async () => {
    setLoading(true);
    setError('');
    setSuccess('');
    setNeedsConfirmation(false);

    // ADMIN LOGIN
    if (email.toLowerCase() === 'admin@georiana.com' && password === 'pawlo2026') { //ask admin for strong username and password
      localStorage.setItem('isAdmin', 'true');
      router.push('/admin');
      setLoading(false);
      return;
    }

    const { data, error: authError } = await supabaseClient.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      if (authError.message.includes("Email not confirmed")) {
        setNeedsConfirmation(true);
        setError("Please confirm your email first.");
      } else {
        setError("Invalid email or password");
      }
    } else if (data.user) {
      setSuccess("Login successful!");
      router.push('/');
    }

    setLoading(false);
  };

  // ==================== RESEND CONFIRMATION EMAIL ====================
  const resendConfirmation = async () => {
    if (!email) return;

    setLoading(true);
    const { error } = await supabaseClient.auth.resend({
      type: 'signup',
      email,
    });

    if (error) {
      setError(error.message);
    } else {
      setSuccess("Confirmation email has been resent. Please check your inbox.");
    }
    setLoading(false);
  };

  return (
    <>
      <Header />
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
            {success && <p className="text-green-600 text-center font-medium">{success}</p>}

            {needsConfirmation && (
              <button
                onClick={resendConfirmation}
                disabled={loading}
                className="w-full text-sm text-blue-600 underline"
              >
                Resend confirmation email
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

          {/* Social Login */}
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

            {/* Instagram */}
            <button
              onClick={() => signInWithProvider('instagram')}
              disabled={loading}
              className="border border-gray-300 hover:bg-gray-50 py-3 rounded-2xl flex items-center justify-center gap-2 transition"
            >
              <img src="/images/instagram.png" alt="Instagram" className="w-8" />
            </button>

            {/* TikTok */}
            <button
              onClick={() => signInWithProvider('tiktok')}
              disabled={loading}
              className="border border-gray-300 hover:bg-gray-50 py-3 rounded-2xl flex items-center justify-center gap-2 transition"
            >
              <img src="/images/tiktok.png" alt="TikTok" className="w-8" />
            </button>
          </div>

          <div className="text-center mt-10 text-sm">
            {t('login.noAccount')}{' '}
            <span 
              onClick={() => router.push('/signup')} 
              className="text-black underline cursor-pointer"
            >
              {t('login.signUp')}
            </span>
          </div>
        </div>
      </div>
    </>
  );
}