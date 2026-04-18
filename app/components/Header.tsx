'use client';

import Link from 'next/link';
import Image from 'next/image';
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

// Helper to create clean URLs
const slugify = (text: string) =>
  text
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]+/g, '');

export default function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const { t, language, changeLanguage } = useTranslation();

  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [reviewCount, setReviewCount] = useState(0);
  const [wishlistCount, setWishlistCount] = useState(0);

  const [categories, setCategories] = useState<string[]>([]);
  const [collections, setCollections] = useState<string[]>([]);

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

  // Wishlist count
  useEffect(() => {
    const fetchWishlistCount = async () => {
      const { data: { user } } = await supabaseClient.auth.getUser();
      if (!user) {
        setWishlistCount(0);
        return;
      }
      const { count } = await supabaseClient
        .from('wishlist')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);
      setWishlistCount(count || 0);
    };
    fetchWishlistCount();
    const interval = setInterval(fetchWishlistCount, 2000);
    return () => clearInterval(interval);
  }, []);

  // Fetch Categories for WOMAN dropdown
  useEffect(() => {
    const fetchCategories = async () => {
      const { data } = await supabaseClient
        .from('products')
        .select('category')
        .not('category', 'is', null);

      const unique = [...new Set(data?.map((p: any) => p.category))].filter(Boolean);
      setCategories(unique);
    };
    fetchCategories();
  }, []);

  // Fetch Collections for Collections dropdown
  useEffect(() => {
    const fetchCollections = async () => {
      const { data } = await supabaseClient
        .from('products')
        .select('collection')
        .not('collection', 'is', null);

      const unique = [...new Set(data?.map((p: any) => p.collection))].filter(Boolean);
      setCollections(unique);
    };
    fetchCollections();
  }, []);

  const handleSignOut = async () => {
    await supabaseClient.auth.signOut();
    router.push('/');
  };

  const showBackButton = pathname !== '/' && pathname !== '/shop';

  return (
    <header className="top-bar bg-white/95 backdrop-blur-md border-b border-gray-200 z-50 fixed top-0 left-0 right-0">
      <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
        
        <div className="flex items-center gap-15">
          {showBackButton && (
            <button 
              onClick={() => router.back()} 
              className="flex items-center gap-1 text-sm text-gray-600 hover:text-black transition"
            >
              <ArrowLeft size={20} />
              <span className="hidden md: ">{t('common.back')}</span>
            </button>
          )}

          {/* Logo */}
          <Link href="/" className="flex items-center">
            <img 
              src="/images/logo.svg" 
              alt="GEORIANA" 
              className="h-15 w-auto" 
            />
          </Link>
        </div>

        <nav className="hidden md:flex gap-10 text-lg font-medium uppercase tracking-widest">
          <Link href="/shop">{t('header.shop')}</Link>

          {/* WOMAN DROPDOWN */}
          <div className="relative group">
            <button className="hover:text-gray-600 transition flex items-center gap-1">
              {t('header.woman')}
              <span className="text-xs">▼</span>
            </button>
            <div className="absolute top-full left-0 mt-1 w-56 bg-white border border-gray-200 rounded-2xl shadow-xl py-3 z-50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
              {categories.length > 0 ? (
              categories.map((category) => (
                <Link
                  key={category}
                  href={`/woman/${slugify(category)}`}
                  className="block px-6 py-3 hover:bg-gray-100 transition text-sm"
                >
                  {t(`category.${slugify(category)}`)}
                </Link>
              ))
            ) : (
              <div className="px-6 py-3 text-gray-400 text-sm">{t('common.noCategories')}</div>
            )}
            </div>
          </div>

          {/* COLLECTIONS DROPDOWN */}
          <div className="relative group">
            <button className="hover:text-gray-600 transition flex items-center gap-1">
              {t('header.collections')}
              <span className="text-xs">▼</span>
            </button>
            <div className="absolute top-full left-0 mt-1 w-64 bg-white border border-gray-200 rounded-2xl shadow-xl py-3 z-50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
              {collections.length > 0 ? (
                collections.map((col) => (
                  <Link
                    key={col}
                    href={`/collection/${slugify(col)}`}
                    className="block px-6 py-3 hover:bg-gray-100 transition text-sm"
                  >
                    {col}
                  </Link>
                ))
              ) : (
                <div className="px-6 py-3 text-gray-400 text-sm">{t('common.noCollections')}</div>
              )}
            </div>
          </div>
          <Link href="/sale" className="text-red-600">{t('header.sale')}</Link>
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
              
              <Link href="/wishlist" className="relative group">
                <Heart 
                  size={22} 
                  className={`transition-all duration-300 ${
                    wishlistCount > 0 
                      ? 'text-red-500 fill-red-500 drop-shadow-[0_0_12px_#ef4444] scale-110' 
                      : 'text-gray-700 group-hover:text-gray-900'
                  }`} 
                />
                {wishlistCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-medium w-5 h-5 flex items-center justify-center rounded-full animate-pulse">
                    {wishlistCount}
                  </span>
                )}
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