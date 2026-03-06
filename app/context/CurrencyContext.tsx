'use client';

import { createContext, useContext, useEffect, useState } from 'react';

type Currency = 'USD' | 'EUR' | 'EGP' | 'GBP' | 'SAR' | 'ARS' |'AED'|'BRL'|'BHD'|'CNY'|'CAD'|'JPY'|'MAD'|'KWD'|'KRW'|'NGN'|'OMR'|'QAR'|'TRY'|'TND'|'INR'|'ZAR'|'GEL'|'RUB';

const currencySymbols: Record<Currency, string> = {
  USD: '$',
  EUR: '€',
  EGP: 'EGP ',
  GBP: '£',
  SAR: 'SAR ',
  ARS:'ARS',
  AED:'AED',
  BRL:'BRL',
  CNY:'CNY',
  BHD:'BHD',
  CAD:'CAD',
  JPY:'JPY',
  KWD:'KWD',
  KRW:'KRW',
  MAD:'MAD',
  NGN:'NGN',
  OMR:'OMR',
  QAR:'QAR',
  TRY:'TRY',
  TND:'TND',
  INR:'INR',
  ZAR:'ZAR',
  GEL:'GEL',
  RUB:'RUB'
  
};

const exchangeRates: Record<Currency, number> = {
  USD: 1,
  EUR: 0.92,
  EGP: 48.5,
  GBP: 0.78,
  SAR: 3.75,
  ARS:0,
  AED:0,
  BRL:0,
  CNY:0,
  BHD:0,
  CAD:0,
  JPY:0,
  KWD:0,
  KRW:0,
  MAD:0,
  NGN:0,
  OMR:0,
  QAR:0,
  TRY:0,
  TND:0,
  INR:0,
  ZAR:0,
  GEL:0,
  RUB:0
};

type CurrencyContextType = {
  currency: Currency;
  setCurrency: (currency: Currency) => void;
  formatPrice: (usdPrice: number) => string;
};

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const [currency, setCurrencyState] = useState<Currency>('USD');

  const setCurrency = (newCurrency: Currency) => {
    setCurrencyState(newCurrency);
    localStorage.setItem('currency', newCurrency);
  };

  const formatPrice = (usdPrice: number) => {
    const converted = (usdPrice * exchangeRates[currency]).toFixed(2);
    return `${currencySymbols[currency]}${converted}`;
  };

  // Auto-detect country on first visit
  useEffect(() => {
    const saved = localStorage.getItem('currency') as Currency;
    if (saved && Object.keys(currencySymbols).includes(saved)) {
      setCurrencyState(saved);
      return;
    }

    fetch('https://ipapi.co/json/')
      .then(res => res.json())
      .then(data => {
        const country = data.country_code;
        let detected: Currency = 'USD';

        if (country === 'EG') detected = 'EGP';
        else if (['FR', 'DE', 'ES', 'IT', 'NL', 'BE', 'AT'].includes(country)) detected = 'EUR';
        else if (country === 'GB') detected = 'GBP';
        else if (country === 'SA') detected = 'SAR';

        setCurrencyState(detected);
        localStorage.setItem('currency', detected);
      })
      .catch(() => setCurrencyState('USD'));
  }, []);

  return (
    <CurrencyContext.Provider value={{ currency, setCurrency, formatPrice }}>
      {children}
    </CurrencyContext.Provider>
  );
}

export const useCurrency = () => {
  const context = useContext(CurrencyContext);
  if (!context) throw new Error('useCurrency must be used inside CurrencyProvider');
  return context;
};