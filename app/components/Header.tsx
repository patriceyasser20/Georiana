'use client';

import Link from 'next/link';
import { Search, User, ShoppingBag, LogOut } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabaseClient } from '../../lib/supabaseClient';

export default function Header() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial user
    const getUser = async () => {
      const { data: { user } } = await supabaseClient.auth.getUser();
      setUser(user);
      setLoading(false);
    };
    getUser();

    // Listen for auth state changes
    const { data: authListener } = supabaseClient.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const handleSignOut = async () => {
    await supabaseClient.auth.signOut();
    router.push('/');
    router.refresh(); // Force refresh to update UI
  };

  return (
    <header className="top-bar bg-white/95 backdrop-blur-md border-b border-gray-200 z-50 fixed top-0 left-0 right-0">
      <div className="max-w-7xl mx-auto px-6 h-70px flex items-center justify-between">
        <Link href="/" className="text-3xl font-bold tracking-[3px]">ZARA</Link>

        <nav className="hidden md:flex gap-10 text-sm font-medium uppercase tracking-widest">
          <Link href="#">WOMAN</Link>
          <Link href="#">MAN</Link>
          <Link href="#">KIDS</Link>
          <Link href="#" className="text-red-600">SALE</Link>
        </nav>

        <div className="flex items-center gap-8 text-xl">
          <button aria-label="Search">
            <Search />
          </button>

          {loading ? (
            <span className="text-sm">...</span>
          ) : user ? (
            <div className="flex items-center gap-4">
              <span className="text-sm hidden md:inline font-medium">
                {user.email?.split('@')[0] || 'User'}
              </span>
              <button
                onClick={handleSignOut}
                className="flex items-center gap-2 text-sm text-gray-700 hover:text-black transition"
                aria-label="Sign out"
              >
                <LogOut size={22} />
                <span className="hidden md:inline">Sign Out</span>
              </button>
            </div>
          ) : (
            <Link href="/login" aria-label="Login">
              <User size={22} />
            </Link>
          )}

          <Link href="/cart" aria-label="Cart">
            <ShoppingBag size={22} />
          </Link>
        </div>
      </div>
    </header>
  );
}