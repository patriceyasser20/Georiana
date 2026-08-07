'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';

type Language = 'en' | 'ar' | 'zh' | 'ja' | 'ru' | 'es' | 'fr' | 'nl';

const translations: Record<Language, any> = {
  en: require('../i18n/translations/en.json'),
  ar: require('../i18n/translations/ar.json'),
  zh: require('../i18n/translations/zh.json'),
  ja: require('../i18n/translations/ja.json'),
  ru: require('../i18n/translations/ru.json'),
  es: require('../i18n/translations/es.json'),
  fr: require('../i18n/translations/fr.json'),
  nl: require('../i18n/translations/nl.json'),
};

// Only en/ar are URL-prefixed right now (matches what's actually exposed
// in Header.tsx's language <select> — the rest are commented out there).
// If more languages get re-enabled without a route prefix, they fall
// through to the old client-only path below.
const ROUTED_LOCALES: Language[] = ['en', 'ar'];

const LanguageContext = createContext<any>(null);

export function LanguageProvider({
  children,
  initialLocale,
}: {
  children: React.ReactNode;
  initialLocale: 'en' | 'ar';
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [language, setLanguage] = useState<Language>(initialLocale);

  // Server (middleware + layout) is the source of truth for routed
  // locales — sync on every navigation (covers back/forward between
  // /shop and /ar/shop, not just the initial load).
  useEffect(() => {
    setLanguage(initialLocale);
    document.documentElement.lang = initialLocale;
    document.documentElement.dir = initialLocale === 'ar' ? 'rtl' : 'ltr';
  }, [initialLocale]);

  const changeLanguage = (code: Language) => {
    if (ROUTED_LOCALES.includes(code)) {
      const currentIsAr = pathname === '/ar' || pathname.startsWith('/ar/');
      const bare = currentIsAr ? (pathname === '/ar' ? '/' : pathname.slice(3)) : pathname;
      const target = code === 'ar' ? (bare === '/' ? '/ar' : `/ar${bare}`) : bare;
      router.push(target);
      return;
    }

    // Non-routed languages — old client-only behavior, unchanged.
    setLanguage(code);
    localStorage.setItem('language', code);
    document.documentElement.lang = code;
    document.documentElement.dir = 'ltr';
  };

  const t = (key: string) => {
    const keys = key.split('.');
    let value = translations[language];
    for (const k of keys) {
      value = value?.[k];
      if (value === undefined) return key;
    }
    return value;
  };

  return (
    <LanguageContext.Provider value={{ language, changeLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export const useTranslation = () => useContext(LanguageContext);