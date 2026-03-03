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

  const handleLogin = () => {
    if (email === 'admin@zara.com' && password === 'admin2026') {
      localStorage.setItem('isAdmin', 'true');
      router.push('/admin');
    } else {
      setError('Wrong admin email or password');
    }
  };

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-3xl p-12 max-w-md w-full text-center">
          <h1 className="text-4xl font-light tracking-widest mb-8">Admin Panel</h1>
          
          <input 
            type="email" 
            placeholder="admin@zara.com" 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="border rounded-2xl px-6 py-4 w-full mb-4"
          />
          <input 
            type="password" 
            placeholder="Password" 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="border rounded-2xl px-6 py-4 w-full mb-6"
          />

          {error && <p className="text-red-600 mb-4">{error}</p>}

          <button 
            onClick={handleLogin}
            className="w-full bg-black text-white py-4 rounded-full text-sm tracking-widest hover:bg-gray-800"
          >
            LOGIN AS ADMIN
          </button>

          <p className="text-xs text-gray-500 mt-6">
            Demo: admin@zara.com / admin2026
          </p>
        </div>
      </div>
      <Footer />
    </>
  );
}