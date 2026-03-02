'use client';

import Link from 'next/link';
import { Search, User, LogOut, ShoppingBag } from 'lucide-react';
import { useEffect, useState } from 'react';
import { supabaseClient } from '../../lib/supabaseClient';
import { useRouter } from 'next/navigation';

export default function Header() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [reviewCount, setReviewCount] = useState(0);

  // Auth listener
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabaseClient.auth.getUser();
      setUser(user);
      setLoading(false);
    };
    getUser();

    const { data: listener } = supabaseClient.auth.onAuthStateChange((_, session) => {
      setUser(session?.user ?? null);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  // Review Order count (updates live)
  useEffect(() => {
    const updateCount = () => {
      const saved = localStorage.getItem('reviewOrder');
      const items = saved ? JSON.parse(saved) : [];
      setReviewCount(items.length);
    };

    updateCount();

    // Listen for changes in localStorage (when adding from Quick View)
    const handleStorageChange = () => updateCount();
    window.addEventListener('storage', handleStorageChange);

    // Also check every time we return to the page
    const interval = setInterval(updateCount, 1000);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, []);

  const handleSignOut = async () => {
    await supabaseClient.auth.signOut();
    router.push('/');
  };

  return (
    <header className="top-bar bg-white/95 backdrop-blur-md border-b border-gray-200 z-50 fixed top-0 left-0 right-0">
      <div className="max-w-7xl mx-auto px-6 h-100px flex items-center justify-between">
        <Link href="/" className="text-3xl font-bold tracking-[3px]">ZARA</Link>

        <nav className="hidden md:flex gap-10 text-sm font-medium uppercase tracking-widest">
          <Link href="#">WOMAN</Link>
          <Link href="#">MAN</Link>
          <Link href="#">KIDS</Link>
          <Link href="#" className="text-red-600">SALE</Link>
        </nav>

        <div className="flex items-center gap-8 text-xl">
          <button><Search /></button>

          {/* User Icon */}
          {loading ? (
            <span>...</span>
          ) : user ? (
            <div className="flex items-center gap-4">
              <span className="text-sm hidden md:inline">{user.email?.split('@')[0]}</span>
              <button onClick={handleSignOut} className="flex items-center gap-2 text-sm hover:text-gray-600">
                <LogOut size={22} />
                <span className="hidden md:inline">Sign Out</span>
              </button>
            </div>
          ) : (
            <Link href="/login"><User size={22} /></Link>
          )}

          {/* Shopping Bag (Bucket) - shows only when there are items */}
          {reviewCount > 0 && (
            <Link href="/review-order" className="relative">
              <ShoppingBag size={22} />
              <span className="absolute -top-1 -right-1 bg-black text-white text-[10px] font-medium w-5 h-5 flex items-center justify-center rounded-full">
                {reviewCount}
              </span>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}