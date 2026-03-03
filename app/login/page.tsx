'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { supabaseClient } from '../../lib/supabaseClient';

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setLoading(true);
    setError('');

    // ADMIN LOGIN (hardcoded demo)
    if (email.toLowerCase() === 'admin@zara.com' && password === 'admin2026') {
      localStorage.setItem('isAdmin', 'true');
      router.push('/admin');
      setLoading(false);
      return;
    }

    // Normal user login with Supabase
    const { error: authError } = await supabaseClient.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      setError('Invalid login credentials');
    } else {
      router.push('/');
    }

    setLoading(false);
  };

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12">
        <div className="bg-white rounded-3xl shadow-xl p-12 max-w-md w-full">
          <div className="text-center mb-10">
            <h1 className="text-5xl font-bold tracking-[3px]">ZARA</h1>
            <p className="text-xl text-gray-500 mt-2">Log in</p>
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
              type="password"
              placeholder="Password"
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
              {loading ? 'Logging in...' : 'LOG IN'}
            </button>
          </div>

          <div className="text-center mt-8 text-sm">
            Don’t have an account?{' '}
            <span 
              onClick={() => router.push('/signup')} 
              className="text-black underline cursor-pointer"
            >
              Sign up
            </span>
          </div>

          <div className="text-center mt-6 text-xs text-gray-500">
            Admin Login: admin@zara.com / admin2026
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}