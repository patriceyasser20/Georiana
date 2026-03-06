'use client';

import Link from 'next/link';
import { User, LogOut, ShoppingBag, ArrowLeft, Heart } from 'lucide-react';
import { useEffect, useState } from 'react';
import { supabaseClient } from '../../lib/supabaseClient';
import { useRouter, usePathname } from 'next/navigation';
import { useTranslation } from '../context/LanguageContext';

const languages = [
  { code: 'en', name: 'English' },
  { code: 'ar', name: 'Arabic' },
  { code: 'zh', name: 'Chinese' },
  { code: 'ja', name: 'Japanese' },
  { code: 'ru', name: 'Russian' },
  { code: 'es', name: 'Spanish' },
  { code: 'fr', name: 'French' },
  { code: 'nl', name: 'Dutch' },
];

export default function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const { t, language, changeLanguage } = useTranslation();

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

  const showBackButton = pathname !== '/' && pathname !== '/shop';

  return (
    <header className="top-bar bg-white/95 backdrop-blur-md border-b border-gray-200 z-50 fixed top-0 left-0 right-0">
      <div className="max-w-7xl mx-auto px-6 h-70px flex items-center justify-between">
        
        <div className="flex items-center gap-4">
          {showBackButton && (
            <button 
              onClick={() => router.back()} 
              className="flex items-center gap-1 text-sm text-gray-600 hover:text-black transition"
            >
              <ArrowLeft size={20} />
              <span className="hidden md:inline">{t('common.back')}</span>
            </button>
          )}

          <Link href="/" className="text-3xl font-bold tracking-[3px]">ZARA</Link>
        </div>

        <nav className="hidden md:flex gap-10 text-sm font-medium uppercase tracking-widest">
          <Link href="/shop">{t('header.shop')}</Link>
          <Link href="#">{t('header.woman')}</Link>
          <Link href="#">{t('header.man')}</Link>
          <Link href="#">{t('header.kids')}</Link>
          <Link href="#" className="text-red-600">{t('header.sale')}</Link>
        </nav>

        <div className="flex items-center gap-8 text-xl">
          {/* Language Selector */}
          <select
            value={language}
            onChange={(e) => changeLanguage(e.target.value as any)}
            className="bg-transparent border border-gray-300 rounded-full px-4 py-1 text-sm focus:outline-none cursor-pointer"
          >
            {languages.map(lang => (
              <option key={lang.code} value={lang.code}>
                {lang.name}
              </option>
            ))}
          </select>

          {/* User Section */}
          {loading ? (
            <span>...</span>
          ) : user ? (
            <div className="flex items-center gap-6">
              <Link href="/account" className="text-sm hover:text-gray-600">{t('header.account')}</Link>
              
              <Link href="/wishlist" className="relative hover:text-gray-600 transition">
                <Heart size={22} />
              </Link>

              <button 
                onClick={handleSignOut} 
                className="flex items-center gap-2 text-sm hover:text-gray-600 transition"
              >
                <LogOut size={22} />
              </button>
            </div>
          ) : (
            <Link href="/login"><User size={22} /></Link>
          )}

          {/* Review Order Bag */}
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