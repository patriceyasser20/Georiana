'use client';

import { useState } from 'react';
import Link from 'next/link';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { supabaseClient as supabase } from '../../lib/supabaseClient';

export default function Signup() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const { error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      setError(error.message);
    } else {
      alert('✅ Account created! You can now log in.');
      window.location.href = '/login';
    }
    setLoading(false);
  };

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gray-50 flex items-center justify-center py-20">
        <div className="bg-white w-full max-w-md p-10 rounded-xl shadow-xl">
          <div className="text-center mb-10">
            <h1 className="text-5xl font-bold tracking-widest">ZARA</h1>
            <p className="text-2xl mt-4 font-light">Create account</p>
          </div>

          <form onSubmit={handleSignup} className="space-y-6">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email address"
              className="w-full border border-gray-300 rounded-lg px-5 py-4 text-lg focus:outline-none focus:border-black"
              required
            />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password (min 6 characters)"
              className="w-full border border-gray-300 rounded-lg px-5 py-4 text-lg focus:outline-none focus:border-black"
              required
            />

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-black text-white py-4 text-sm tracking-widest hover:bg-gray-800 disabled:opacity-50"
            >
              {loading ? 'Creating account...' : 'CREATE ACCOUNT'}
            </button>

            {error && <p className="text-red-600 text-center text-sm">{error}</p>}
          </form>

          <div className="text-center mt-8 text-sm">
            Already have an account? <Link href="/login" className="underline">Log in</Link>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}