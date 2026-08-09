'use client';

import Link from 'next/link';
import { User, LogOut, ShoppingBag, Heart, Menu, X, ChevronDown } from 'lucide-react';
import { useEffect, useState } from 'react';
import { supabaseClient } from '../../lib/supabaseClient';
import { useRouter, usePathname } from 'next/navigation';
import { useTranslation } from '../context/LanguageContext';
import { useCurrency } from '../context/CurrencyContext';
import { getCached, setCached } from '../../lib/productCache';

const languages = [
  { code: 'en', name: 'English' },
  { code: 'ar', name: 'Arabic' },
  // { code: 'zh', name: 'Chinese' },
  // { code: 'ja', name: 'Japanese' },
  // { code: 'ru', name: 'Russian' },
  // { code: 'es', name: 'Spanish' },
  // { code: 'fr', name: 'French' },
  // { code: 'nl', name: 'Dutch' },
];

const slugify = (text: string) =>
  text.toLowerCase().trim().replace(/\s+/g, '-').replace(/[^\w-]+/g, '');

export default function Header() {
  const { currency, setCurrency } = useCurrency();
  const currencies = ['EGP', 'USD', 'EUR', 'GBP', 'SAR', 'AED'];
  const router = useRouter();
  const pathname = usePathname();
  const { t, language, changeLanguage } = useTranslation();

  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [reviewCount, setReviewCount] = useState(0);
  const [wishlistCount, setWishlistCount] = useState(0);
  const [categories, setCategories] = useState<string[]>([]);
  const [collections, setCollections] = useState<string[]>([]);

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileCatOpen, setMobileCatOpen] = useState(false);
  const [mobileColOpen, setMobileColOpen] = useState(false);

  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [mobileMenuOpen]);

  useEffect(() => {
    let mounted = true;
    supabaseClient.auth.getSession().then(({ data: { session } }) => {
      if (mounted) { setUser(session?.user ?? null); setLoading(false); }
    });
    const { data: listener } = supabaseClient.auth.onAuthStateChange((_, session) => {
      if (mounted) { setUser(session?.user ?? null); setLoading(false); }
    });
    return () => { mounted = false; listener.subscription.unsubscribe(); };
  }, []);

  useEffect(() => {
    const updateCount = () => {
      const saved = localStorage.getItem('reviewOrder');
      setReviewCount(saved ? JSON.parse(saved).length : 0);
    };
    updateCount();
    window.addEventListener('storage', updateCount);
    window.addEventListener('reviewOrderUpdated', updateCount);
    return () => {
      window.removeEventListener('storage', updateCount);
      window.removeEventListener('reviewOrderUpdated', updateCount);
    };
  }, []);

  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const checkAdmin = () => setIsAdmin(localStorage.getItem('isAdmin') === 'true');
    checkAdmin();
    // Keep in sync if login/logout happens in another tab, or right after
    // the admin-token flow sets it in this same tab.
    window.addEventListener('storage', checkAdmin);
    return () => window.removeEventListener('storage', checkAdmin);
  }, [user]); // re-check whenever auth state changes (login/logout)

  useEffect(() => {
    let channel: any = null;
    let cancelled = false;
    let handleWishlistUpdated: (() => void) | null = null;

    const channelName = `wishlist-count-${Math.random().toString(36).slice(2)}`;

    const fetchCount = async (userId: string) => {
      const { count } = await supabaseClient
        .from('wishlist')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);
      if (!cancelled) setWishlistCount(count || 0);
    };

    const setupRealtime = async () => {
      const { data: { user } } = await supabaseClient.auth.getUser();
      if (!user) { if (!cancelled) setWishlistCount(0); return; }

      await fetchCount(user.id);
      if (cancelled) return;

      handleWishlistUpdated = () => fetchCount(user.id);
      window.addEventListener('wishlistUpdated', handleWishlistUpdated);

      channel = supabaseClient
        .channel(channelName)
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'wishlist', filter: `user_id=eq.${user.id}` },
          () => fetchCount(user.id)
        )
        .subscribe();
    };

    setupRealtime();

    return () => {
      cancelled = true;
      if (handleWishlistUpdated) {
        window.removeEventListener('wishlistUpdated', handleWishlistUpdated);
      }
      if (channel) {
        supabaseClient.removeChannel(channel);
        channel = null;
      }
    };
  }, []);

  useEffect(() => {
    const fetchCategories = async () => {
      const cached = getCached('header-categories');
      if (cached) { setCategories(cached as string[]); return; }
      const { data } = await supabaseClient.from('products').select('category').not('category', 'is', null);
      const unique = [...new Set(data?.map((p: any) => p.category))].filter(Boolean) as string[];
      setCached('header-categories', unique, 10 * 60 * 1000);
      setCategories(unique);
    };
    fetchCategories();
  }, []);

  useEffect(() => {
    const fetchCollections = async () => {
      const cached = getCached('header-collections');
      if (cached) { setCollections(cached as string[]); return; }
      const { data } = await supabaseClient.from('products').select('collection').not('collection', 'is', null);
      const unique = [...new Set(data?.map((p: any) => p.collection))].filter(Boolean) as string[];
      setCached('header-collections', unique, 10 * 60 * 1000);
      setCollections(unique);
    };
    fetchCollections();
  }, []);

  const handleSignOut = async () => {
    await supabaseClient.auth.signOut();
    localStorage.removeItem('isAdmin');
    localStorage.removeItem('adminToken');
    setIsAdmin(false);
    setMobileMenuOpen(false);
    router.push('/');
  };

  useEffect(() => { setMobileMenuOpen(false); }, [pathname]);

  return (
    <>
      <header suppressHydrationWarning className="bg-white border-b border-gray-200 z-50 fixed top-0 left-0 right-0">
        <div className="max-w-7xl mx-auto px-4 md:px-6 h-16 md:h-20 flex items-center justify-between gap-4">

          {/* ════════════════════════════════
          PART 1 — Help dropdown + Logo + Slogan
          ════════════════════════════════ */}
          <div className="flex items-center gap-4 flex-shrink-0">
            <Link href="/" className="flex items-end gap-3">
              <img src="/images/logo.svg" alt="GEORIANA" className="h-16 md:h-18 w-auto" />
              <span className="hidden md:block text-gray-400 text-base leading-none mb-1">·</span>
              <span className="hidden md:block text-[12px] tracking-[0.35em] uppercase text-gray-900 font-light mb-1">
                Wear Intuitively
              </span>
            </Link>
          </div>

          {/* ════════════════════════════════
              PART 2 — Navigation (centered)
          ════════════════════════════════ */}
          <div className="hidden md:flex flex-1 justify-center">
            <nav
              className={`flex items-center gap-8 font-medium ${
                language === "ar"
                  ? "text-lg tracking-normal"
                  : "text-md uppercase tracking-widest"
              }`}
            >

              <Link href="/shop" className="hover:text-gray-500 transition">
                {t('header.shop')}
              </Link>

              {/* Woman dropdown */}
              <div className="relative group">
                <button className="hover:text-gray-500 transition flex items-center gap-1">
                  {t('header.woman')} <span className="text-xs">▼</span>
                </button>
                <div className="absolute top-full left-0 mt-2 w-52 bg-white border border-gray-200 rounded-2xl shadow-xl py-3 z-50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                  {categories.length > 0 ? categories.map((category) => (
                    <Link
                      key={category}
                      href={`/woman/${slugify(category)}`}
                      className="block px-6 py-3 hover:bg-gray-50 transition text-sm normal-case"
                    >
                      {t(`category.${slugify(category)}`)}
                    </Link>
                  )) : (
                    <div className="px-6 py-3 text-gray-400 text-sm">{t('common.noCategories')}</div>
                  )}
                </div>
              </div>

              {/* Collections dropdown */}
              <div className="relative group">
                <button className="hover:text-gray-500 transition flex items-center gap-1">
                  {t('header.collections')} <span className="text-xs">▼</span>
                </button>
                <div className="absolute top-full left-0 mt-2 w-60 bg-white border border-gray-200 rounded-2xl shadow-xl py-3 z-50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                  {collections.length > 0 ? collections.map((col) => (
                    <Link
                      key={col}
                      href={`/collection/${slugify(col)}`}
                      className="block px-6 py-3 hover:bg-gray-50 transition text-sm normal-case"
                    >
                      {col}
                    </Link>
                  )) : (
                    <div className="px-6 py-3 text-gray-400 text-sm">{t('common.noCollections')}</div>
                  )}
                </div>
              </div>

              <Link href="/sale" className="text-red-600 hover:text-red-500 transition">
                {t('header.sale')}
              </Link>

            </nav>
          </div>

          {/* ════════════════════════════════
              PART 2.5 — Help dropdown
          ════════════════════════════════ */}
          <div className="hidden md:block relative group flex-shrink-0">
            <button className="hover:text-gray-500 transition flex items-center gap-1">
              <ChevronDown size={25} />
            </button>
            <div className="absolute top-full end-0 mt-2 w-56 bg-white border border-gray-200 rounded-2xl shadow-xl py-3 z-50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
              <Link href="/about" className="block px-6 py-3 hover:bg-gray-50 transition text-sm normal-case">
                {t('footer.aboutUs')}
              </Link>
              <Link href="/our-story" className="block px-6 py-3 hover:bg-gray-50 transition text-sm normal-case">
                {t('footer.ourStory')}
              </Link>
              <Link href="/return-exchange" className="block px-6 py-3 hover:bg-gray-50 transition text-sm normal-case">
                {t('footer.returns')}
              </Link>
              <Link href="/size-guide" className="block px-6 py-3 hover:bg-gray-50 transition text-sm normal-case">
                {t('footer.sizeGuide')}
              </Link>
            </div>
          </div>

          {/* ════════════════════════════════
              PART 3 — Icons + Auth (right)
          ════════════════════════════════ */}
          <div suppressHydrationWarning className="flex items-center gap-3 md:gap-5 flex-shrink-0">

            {/* Language — desktop only */}
            <select
              value={language}
              onChange={(e) => changeLanguage(e.target.value as any)}
              className="hidden md:block bg-transparent border border-gray-300 rounded-full px-5 py-1 text-sm focus:outline-none cursor-pointer"
              suppressHydrationWarning
            >
              {languages.map(lang => (
                <option key={lang.code} value={lang.code}>{lang.name}</option>
              ))}
            </select>

            {/* Currency — desktop only */}
            {/* <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="hidden md:block bg-transparent border border-gray-300 rounded-full px-3 py-1 text-sm focus:outline-none cursor-pointer"
              suppressHydrationWarning
            >
              {currencies.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select> */}

            {/* Cart */}
            {reviewCount > 0 && (
              <Link href="/review-order" className="relative" suppressHydrationWarning>
                <ShoppingBag size={22} />
                <span className="absolute -top-1 -right-1 bg-black text-white text-[10px] font-medium w-5 h-5 flex items-center justify-center rounded-full">
                  {reviewCount}
                </span>
              </Link>
            )}

            {/* Wishlist — logged in only */}
            {!loading && user && (
              <Link href="/wishlist" className="relative" suppressHydrationWarning>
                <Heart
                  size={22}
                  className={wishlistCount > 0 ? 'text-red-500 fill-red-500' : 'text-gray-700'}
                />
                {wishlistCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-medium w-5 h-5 flex items-center justify-center rounded-full animate-pulse">
                    {wishlistCount}
                  </span>
                )}
              </Link>
            )}

            {/* Auth — desktop only */}
            {!loading && (
              <div className="hidden md:flex items-center gap-4" suppressHydrationWarning>
                {user ? (
                  <>
                    <Link href={isAdmin ? '/admin' : '/account'} className="text-sm hover:text-gray-500 transition">
                      {isAdmin ? 'Admin' : t('header.account')}
                    </Link>
                    <button
                      onClick={handleSignOut}
                      className="flex items-center text-sm hover:text-gray-500 transition"
                      suppressHydrationWarning
                    >
                      <LogOut size={20} />
                    </button>
                  </>
                ) : (
                  <Link href="/login" suppressHydrationWarning>
                    <User size={22} />
                  </Link>
                )}
              </div>
            )}

            {/* Hamburger — mobile only */}
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="md:hidden p-1"
              aria-label="Open menu"
              suppressHydrationWarning
            >
              <Menu size={26} />
            </button>

          </div>
        </div>
      </header>

      {/* ════════════════════════════════
          MOBILE DRAWER
      ════════════════════════════════ */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-[100] flex md:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobileMenuOpen(false)} />

          <div className="relative ml-auto w-4/5 max-w-xs h-full bg-white flex flex-col overflow-y-auto shadow-2xl">

            {/* Drawer header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <img src="/images/logo.svg" alt="GEORIANA" className="h-8 w-auto" />
                <span className="text-[9px] tracking-[0.3em] uppercase text-gray-400 font-light border-l border-gray-200 pl-2">
                  Wear Intuitively
                </span>
              </div>
              <button onClick={() => setMobileMenuOpen(false)} suppressHydrationWarning>
                <X size={24} />
              </button>
            </div>

            {/* Language + Currency */}
            <div className="px-6 pt-5 pb-2 flex gap-3">
              <select
                value={language}
                onChange={(e) => changeLanguage(e.target.value as any)}
                className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none"
                suppressHydrationWarning
              >
                {languages.map(lang => (
                  <option key={lang.code} value={lang.code}>{lang.name}</option>
                ))}
              </select>
              {/* <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none"
                suppressHydrationWarning
              >
                {currencies.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select> */}
            </div>

            {/* Nav links */}
           <nav
              className={`flex flex-col px-6 py-4 gap-0 font-medium flex-1 ${
                language === "ar"
                  ? "text-lg tracking-normal"
                  : "text-sm uppercase tracking-widest"
              }`}
            >

              <Link href="/shop" className="py-4 border-b border-gray-100 hover:text-gray-500 transition" onClick={() => setMobileMenuOpen(false)}>
                {t('header.shop')}
              </Link>

              {/* Woman accordion */}
              <div className="border-b border-gray-100">
                <button
                  onClick={() => setMobileCatOpen(!mobileCatOpen)}
                  className="w-full flex justify-between items-center py-4 hover:text-gray-500 transition"
                  suppressHydrationWarning
                >
                  {t('header.woman')}
                  <span className="text-xs text-gray-400">{mobileCatOpen ? '▲' : '▼'}</span>
                </button>
                {mobileCatOpen && (
                  <div className="pb-3 pl-3 flex flex-col gap-0">
                    {categories.map((category) => (
                      <Link
                        key={category}
                        href={`/woman/${slugify(category)}`}
                        className="py-2.5 text-xs text-gray-500 hover:text-black transition capitalize"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        {t(`category.${slugify(category)}`)}
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              {/* Collections accordion */}
              <div className="border-b border-gray-100">
                <button
                  onClick={() => setMobileColOpen(!mobileColOpen)}
                  className="w-full flex justify-between items-center py-4 hover:text-gray-500 transition"
                  suppressHydrationWarning
                >
                  {t('header.collections')}
                  <span className="text-xs text-gray-400">{mobileColOpen ? '▲' : '▼'}</span>
                </button>
                {mobileColOpen && (
                  <div className="pb-3 pl-3 flex flex-col gap-0">
                    {collections.map((col) => (
                      <Link
                        key={col}
                        href={`/collection/${slugify(col)}`}
                        className="py-2.5 text-xs text-gray-500 hover:text-black transition"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        {col}
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              <Link href="/sale" className="py-4 border-b border-gray-100 text-red-600" onClick={() => setMobileMenuOpen(false)}>
                {t('header.sale')}
              </Link>
            </nav>

            {/* Auth — bottom */}
            <div className="px-6 pb-10 pt-6 border-t border-gray-100" suppressHydrationWarning>
              {!loading && (
                user ? (
                  <div className="flex flex-col gap-4">
                    <Link href={isAdmin ? '/admin' : '/account'} className="flex items-center gap-3 text-sm font-medium hover:text-gray-600 transition" onClick={() => setMobileMenuOpen(false)} suppressHydrationWarning>
                      <User size={18} />
                      {isAdmin ? 'Admin' : t('header.account')}
                    </Link>
                    <button onClick={handleSignOut} className="flex items-center gap-3 text-sm font-medium text-gray-400 hover:text-black transition" suppressHydrationWarning>
                      <LogOut size={18} />
                      Sign Out
                    </button>
                  </div>
                ) : (
                  <Link href="/login" className="flex items-center gap-3 text-sm font-medium hover:text-gray-600 transition" onClick={() => setMobileMenuOpen(false)} suppressHydrationWarning>
                    <User size={18} />
                    Sign In
                  </Link>
                )
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}