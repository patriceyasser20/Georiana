'use client';

import { useEffect, useState, useCallback } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { X } from 'lucide-react';
import { supabaseClient } from '../../lib/supabaseClient';
import { useTranslation } from '../context/LanguageContext';

const DISMISS_KEY = 'firstOrderPopupDismissedAt';
const DISMISS_DAYS = 7;
const SHOW_AFTER_MS = 6000;
const SCROLL_THRESHOLD = 0.5;

export default function FirstOrderPopup() {
  const pathname = usePathname();
  const router = useRouter();
  const { t } = useTranslation();
  const [eligible, setEligible] = useState(false);
  const [visible, setVisible] = useState(false);
  const [checked, setChecked] = useState(false);

  const excluded =
    pathname?.startsWith('/admin') ||
    pathname?.startsWith('/login') ||
    pathname?.startsWith('/signup') ||
    pathname?.startsWith('/checkout');

  useEffect(() => {
    if (excluded) { setChecked(true); return; }

    const checkEligibility = async () => {
      const dismissedAt = localStorage.getItem(DISMISS_KEY);
      if (dismissedAt === 'permanent') { setChecked(true); return; }
      if (dismissedAt) {
        const daysSince = (Date.now() - Number(dismissedAt)) / (1000 * 60 * 60 * 24);
        if (daysSince < DISMISS_DAYS) { setChecked(true); return; }
      }

      const { data: { user } } = await supabaseClient.auth.getUser();

      if (user) {
        const [{ count: orderCount }, { data: promoUsage }] = await Promise.all([
          supabaseClient.from('orders').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
          supabaseClient.from('promo_usage').select('id').eq('user_id', user.id).eq('promo_code', 'FIRST10').maybeSingle(),
        ]);

        if ((orderCount || 0) > 0 || promoUsage) {
          setChecked(true);
          return;
        }
      }

      setEligible(true);
      setChecked(true);
    };

    checkEligibility();
  }, [excluded]);

  useEffect(() => {
    if (!eligible || visible) return;

    let shown = false;
    const show = () => { if (!shown) { shown = true; setVisible(true); } };

    const timer = setTimeout(show, SHOW_AFTER_MS);

    const handleScroll = () => {
      const scrolled = window.scrollY / (document.documentElement.scrollHeight - window.innerHeight);
      if (scrolled >= SCROLL_THRESHOLD) show();
    };
    window.addEventListener('scroll', handleScroll, { passive: true });

    const handleMouseLeave = (e: MouseEvent) => { if (e.clientY <= 0) show(); };
    document.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('scroll', handleScroll);
      document.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [eligible, visible]);

  const dismiss = useCallback(() => {
    localStorage.setItem(DISMISS_KEY, Date.now().toString());
    setVisible(false);
    setEligible(false);
  }, []);
  const dismissPermanently = useCallback(() => {
    localStorage.setItem(DISMISS_KEY, 'permanent');
    setVisible(false);
    setEligible(false);
  }, []);

  useEffect(() => {
    if (!visible) return;
    const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') dismiss(); };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [visible, dismiss]);

  const handleCta = () => {
    dismiss();
    router.push('/signup');
  };

  if (!checked || excluded || !visible) return null;

  return (
    <div
      className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center bg-black/30 px-4 pb-4 sm:pb-0"
      onClick={dismiss}
    >
      <div
        className="relative bg-white rounded-3xl shadow-2xl w-full max-w-sm p-8 text-center"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={dismiss}
          aria-label="Close"
          className="absolute top-4 right-4 text-gray-400 hover:text-black transition p-1"
        >
          <X size={20} />
        </button>

        <p className="text-xs tracking-[0.3em] uppercase text-[#c9a38f] mb-3">{t('firstOrderPopup.welcome')}</p>
        <h3 className="text-2xl font-light tracking-wide mb-3">{t('firstOrderPopup.title')}</h3>
        <p className="text-sm text-gray-500 mb-6">{t('firstOrderPopup.text')}</p>

        <button
          onClick={handleCta}
          className="w-full bg-black text-white py-4 rounded-full text-sm tracking-widest hover:bg-gray-800 transition"
        >
          {t('firstOrderPopup.cta')}
        </button>
        
        <button onClick={dismissPermanently} className="mt-4 text-xs text-gray-400 hover:text-gray-600 transition">
           {t('firstOrderPopup.noThanks')}
        </button>
      </div>
    </div>
  );
}