'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { supabaseClient } from '../../lib/supabaseClient';
import { useTranslation } from '../context/LanguageContext';
import { Apple, Twitter } from 'lucide-react';

export default function Signup() {
  const router = useRouter();
  const { t } = useTranslation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');          // ← New
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignup = async () => {
    setLoading(true);
    setError('');
    setSuccess('');

    const { error: authError } = await supabaseClient.auth.signUp({
      email,
      password,
      phone,
      options: {
        data: { phone },                     // ← Saved in user_metadata
        emailRedirectTo: `${window.location.origin}/callback`,
      },
    });

    if (authError) {
      setError(authError.message);
    } else {
      setSuccess("✅ Account created successfully! Please check your email to confirm your account.");
      setTimeout(() => {
        router.push('/login');
      }, 3500);
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
              className="h-14 mx-auto" 
            />
            <p className="text-xl text-gray-500 mt-4">Create your account</p>
          </div>

          <div className="space-y-6">
            <input
              type="email"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="border rounded-2xl px-6 py-4 w-full focus:outline-none focus:border-black"
            />
            <input
              type="tel"
              placeholder="Phone number"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="border rounded-2xl px-6 py-4 w-full focus:outline-none focus:border-black"
            />
            <input
              type="password"
              placeholder="Password (min 6 characters)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="border rounded-2xl px-6 py-4 w-full focus:outline-none focus:border-black"
            />

            {error && <p className="text-red-600 text-center font-medium">{error}</p>}
            {success && <p className="text-green-600 text-center font-medium">{success}</p>}

            <button
              onClick={handleSignup}
              disabled={loading}
              className="w-full bg-black text-white py-4 rounded-full text-sm tracking-widest hover:bg-gray-800 disabled:opacity-70 transition"
            >
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </div>

          {/* Social Signup */}
          <div className="my-8 relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-white px-4 text-gray-500">Or sign up with</span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <button className="border border-gray-300 hover:bg-gray-50 py-3 rounded-2xl flex items-center justify-center gap-2 transition">
              <img src="https://www.google.com/images/branding/googleg/1x/googleg_standard_color_24dp.png" alt="Google" className="w-6" />
            </button>
            <button className="border border-gray-300 hover:bg-gray-50 py-3 rounded-2xl flex items-center justify-center gap-2 transition">
              <Apple size={24} />
            </button>
            <button className="border border-gray-300 hover:bg-gray-50 py-3 rounded-2xl flex items-center justify-center gap-2 transition">
              <Twitter size={24} />
            </button>
          </div>

          <div className="text-center mt-10 text-sm">
            Already have an account?{' '}
            <span 
              onClick={() => router.push('/login')} 
              className="text-black underline cursor-pointer"
            >
              Log in
            </span>
          </div>
        </div>
      </div>
    </>
  );
}