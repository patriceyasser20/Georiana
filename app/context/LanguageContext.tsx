'use client';

import { createContext, useContext, useEffect, useState } from 'react';

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

const LanguageContext = createContext<any>(null);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguage] = useState<Language>('en');

  const changeLanguage = (code: Language) => {
    setLanguage(code);
    localStorage.setItem('language', code);
    document.documentElement.lang = code;
    document.documentElement.dir = code === 'ar' ? 'rtl' : 'ltr';
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

  useEffect(() => {
    const saved = localStorage.getItem('language') as Language;
    if (saved && translations[saved]) {
      setLanguage(saved);
      document.documentElement.lang = saved;
      document.documentElement.dir = saved === 'ar' ? 'rtl' : 'ltr';
    }
  }, []);

  return (
    <LanguageContext.Provider value={{ language, changeLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export const useTranslation = () => useContext(LanguageContext);