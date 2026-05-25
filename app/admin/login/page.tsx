'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Header from '../../components/Header';
import Footer from '../../components/Footer';

export default function AdminLogin() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = () => {
    setLoading(true);
    setError('');

    // Strict check for new admin
    if (email.trim().toLowerCase() === 'admin@georiana.com' && password === 'pawlo2026') {
      localStorage.setItem('isAdmin', 'true');
      router.push('/admin');
    } else {
      setError('Invalid admin email or password');
    }

    setLoading(false);
  };

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12">
        <div className="bg-white rounded-3xl p-12 max-w-md w-full text-center shadow-sm">
          <h1 className="text-4xl font-light tracking-widest mb-8">Admin Panel</h1>
          
          <input 
            type="email" 
            placeholder="admin@georiana.com" 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="border rounded-2xl px-6 py-4 w-full mb-4 text-center"
          />
          <input 
            type="password" 
            placeholder="Password" 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="border rounded-2xl px-6 py-4 w-full mb-6"
          />

          {error && <p className="text-red-600 mb-4 font-medium">{error}</p>}

          <button 
            onClick={handleLogin}
            disabled={loading}
            className="w-full bg-black text-white py-4 rounded-full text-sm tracking-widest hover:bg-gray-800 disabled:opacity-70 transition"
          >
            {loading ? 'Logging in...' : 'LOGIN AS ADMIN'}
          </button>

          <p className="text-xs text-gray-500 mt-8">
            Demo: admin@georiana.com / pawlo2026
          </p>
        </div>
      </div>
      <Footer />
    </>
  );
}