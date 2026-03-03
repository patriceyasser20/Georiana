'use client';

import Link from 'next/link';
import { Search, User, LogOut, ShoppingBag, ArrowLeft } from 'lucide-react';
import { useEffect, useState } from 'react';
import { supabaseClient } from '../../lib/supabaseClient';
import { useRouter, usePathname } from 'next/navigation';

export default function Header() {
  const router = useRouter();
  const pathname = usePathname();
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

  // Review Order count
  useEffect(() => {
    const updateCount = () => {
      const saved = localStorage.getItem('reviewOrder');
      const items = saved ? JSON.parse(saved) : [];
      setReviewCount(items.length);
    };
    updateCount();
    const interval = setInterval(updateCount, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleSignOut = async () => {
    await supabaseClient.auth.signOut();
    router.push('/');
  };

  const showBackButton = pathname !== '/';

  return (
    <header className="top-bar bg-white/95 backdrop-blur-md border-b border-gray-200 z-50 fixed top-0 left-0 right-0">
      <div className="max-w-7xl mx-auto px-6 h-70px flex items-center justify-between">
        
        <div className="flex items-center gap-4">
          {/* Back Button - appears on every page except home */}
          {showBackButton && (
            <button 
              onClick={() => router.back()} 
              className="flex items-center gap-1 text-sm text-gray-600 hover:text-black transition"
            >
              <ArrowLeft size={20} />
              <span className="hidden md:inline">Back</span>
            </button>
          )}

          <Link href="/" className="text-3xl font-bold tracking-[3px]">ZARA</Link>
        </div>

        <nav className="hidden md:flex gap-10 text-sm font-medium uppercase tracking-widest">
          <Link href="#">WOMAN</Link>
          <Link href="#">MAN</Link>
          <Link href="#">KIDS</Link>
          <Link href="#" className="text-red-600">SALE</Link>
        </nav>

        <div className="flex items-center gap-8 text-xl">
          <button><Search /></button>

          {/* User Section */}
          {loading ? (
            <span>...</span>
          ) : user ? (
            <div className="flex items-center gap-6">
              <Link href="/account" className="text-sm hover:text-gray-600">Account</Link>
              <button onClick={handleSignOut} className="flex items-center gap-2 text-sm hover:text-gray-600">
                <LogOut size={22} />
              </button>
            </div>
          ) : (
            <Link href="/login"><User size={22} /></Link>
          )}

          {/* Shopping Bag */}
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