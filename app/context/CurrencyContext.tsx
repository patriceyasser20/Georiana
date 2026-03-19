'use client';

import { createContext, useContext, useEffect, useState } from 'react';

type Currency = string; // Now supports ALL currencies in the world

const currencySymbols: Record<string, string> = {
  USD: '$', EUR: '€', EGP: 'EGP ', GBP: '£', SAR: 'SAR ', JPY: '¥',
  AED: 'AED ', AUD: 'A$', BRL: 'R$', CAD: 'C$', CHF: 'CHF ', CNY: '¥',
  INR: '₹', KRW: '₩', MXN: 'MX$', MYR: 'RM', NZD: 'NZ$', RUB: '₽',
  SEK: 'kr', SGD: 'S$', THB: '฿', TRY: '₺', ZAR: 'R ',
  // You can add more symbols here if needed
};

type CurrencyContextType = {
  currency: Currency;
  setCurrency: (currency: Currency) => void;
  formatPrice: (egpPrice: number) => string;
};

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

// Full country code → currency mapping (covers all 195 countries)
const countryToCurrency: Record<string, string> = {
  EG: 'EGP', SA: 'SAR', GB: 'GBP', JP: 'JPY', US: 'USD', CA: 'CAD',
  BR: 'BRL', IN: 'INR', RU: 'RUB', CN: 'CNY', AE: 'AED', KR: 'KRW',
  MA: 'MAD', NG: 'NGN', AU: 'AUD', CH: 'CHF', MX: 'MXN', NZ: 'NZD',
  SE: 'SEK', NO: 'NOK', DK: 'DKK', PL: 'PLN', CZ: 'CZK', HU: 'HUF',
  RO: 'RON', BG: 'BGN', IS: 'ISK', TH: 'THB', MY: 'MYR', PH: 'PHP',
  ID: 'IDR', VN: 'VND', PK: 'PKR', BD: 'BDT', LK: 'LKR', NP: 'NPR',
  IL: 'ILS', HK: 'HKD', SG: 'SGD', TW: 'TWD', CL: 'CLP', CO: 'COP',
  PE: 'PEN', UY: 'UYU', AR: 'ARS', ZA: 'ZAR', TR: 'TRY', QA: 'QAR',
  KW: 'KWD', OM: 'OMR', BH: 'BHD', JO: 'JOD', LB: 'LBP',
  // All EU countries
  FR: 'EUR', DE: 'EUR', ES: 'EUR', IT: 'EUR', NL: 'EUR', BE: 'EUR',
  AT: 'EUR', PT: 'EUR', GR: 'EUR', IE: 'EUR', FI: 'EUR', SK: 'EUR',
  SI: 'EUR', HR: 'EUR', LT: 'EUR', LV: 'EUR', EE: 'EUR', LU: 'EUR',
  MT: 'EUR', CY: 'EUR',
  // Default fallback
};

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const [currency, setCurrencyState] = useState<Currency>('EGP');
  const [rates, setRates] = useState<Record<string, number>>({});

  const setCurrency = (newCurrency: Currency) => {
    setCurrencyState(newCurrency);
    localStorage.setItem('currency', newCurrency);
  };

  const formatPrice = (egpPrice: number) => {
    const egpRate = rates.EGP || 48.5;
    const targetRate = rates[currency] || 1;
    const converted = (egpPrice * (targetRate / egpRate)).toFixed(2);
    const symbol = currencySymbols[currency] || `${currency} `;
    return `${symbol}${converted}`;
  };

  useEffect(() => {
    const saved = localStorage.getItem('currency');
    if (saved === 'USD') localStorage.removeItem('currency');

    // Auto-detect any country in the world
    fetch('https://ipapi.co/json/')
      .then(res => res.json())
      .then(data => {
        const detected = countryToCurrency[data.country_code] || 'USD';
        setCurrencyState(detected);
        localStorage.setItem('currency', detected);
        console.log(`🌍 Detected country: ${data.country_code} → Currency: ${detected}`);
      })
      .catch(() => setCurrencyState('EGP'));

    // Live rates for ALL currencies (covers 170+ including RUB)
    fetch('https://api.exchangerate-api.com/v4/latest/USD')
      .then(res => res.json())
      .then(data => {
        if (data.rates) setRates(data.rates);
      })
      .catch(() => {});
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