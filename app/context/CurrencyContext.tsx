'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { supabaseClient } from '../../lib/supabaseClient';

type Currency = string;

const currencySymbols: Record<string, string> = {
  USD: '$', EUR: '€', EGP: 'EGP ', GBP: '£', SAR: 'SAR ', JPY: '¥',
  AED: 'AED ', AUD: 'A$', BRL: 'R$', CAD: 'C$', CHF: 'CHF ', CNY: '¥',
  INR: '₹', KRW: '₩', MXN: 'MX$', MYR: 'RM', NZD: 'NZ$', RUB: '₽',
  SEK: 'kr', SGD: 'S$', THB: '฿', TRY: '₺', ZAR: 'R ',
};

type CurrencyContextType = {
  currency: Currency;
  setCurrency: (currency: Currency) => void;
  formatPrice: (egpPrice: number) => string;
  wishlist: any[];
  setWishlist: React.Dispatch<React.SetStateAction<any[]>>;
};

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

const countryToCurrency: Record<string, string> = {
  EG: 'EGP', SA: 'SAR', GB: 'GBP', JP: 'JPY', US: 'USD', CA: 'CAD', 
  BR: 'BRL', IN: 'INR', RU: 'RUB', CN: 'CNY', AE: 'AED', KR: 'KRW',
  FR: 'EUR', DE: 'EUR', ES: 'EUR', IT: 'EUR', NL: 'EUR', BE: 'EUR',
  AT: 'EUR', PT: 'EUR', GR: 'EUR', IE: 'EUR', FI: 'EUR', SK: 'EUR',
  SI: 'EUR', HR: 'EUR', LT: 'EUR', LV: 'EUR', EE: 'EUR', LU: 'EUR',
  MT: 'EUR', CY: 'EUR',
  SG: 'SGD',   // ← Added Singapore
};
const CURRENCY_TTL = 60 * 60 * 1000;
export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const [currency, setCurrencyState] = useState<Currency>('EGP');
  const [rates, setRates] = useState<Record<string, number>>({});
  const [wishlist, setWishlist] = useState<any[]>([]);

  const setCurrency = (newCurrency: Currency) => {
    setCurrencyState(newCurrency);
    localStorage.setItem('currency', newCurrency);
    localStorage.setItem('currency_ts', String(Date.now()));
    localStorage.setItem('currency_source', 'manual');
  };

  const formatPrice = (egpPrice: number) => {
    // EGP is the base currency stored in the DB — never convert it
    if (currency === 'EGP') {
      return `EGP ${egpPrice.toFixed(2)}`;
    }

    // If rates haven't loaded yet, show EGP as a safe fallback
    if (!rates.EGP || !rates[currency]) {
      return `EGP ${egpPrice.toFixed(2)}`;
    }

    const egpRate = rates.EGP;
    const targetRate = rates[currency];
    const converted = (egpPrice * (targetRate / egpRate)).toFixed(2);
    const symbol = currencySymbols[currency] || `${currency} `;
    return `${symbol}${converted}`;
  };

  // Auto-detect country + fetch exchange rates
  useEffect(() => {
    const savedCurrency = localStorage.getItem('currency');
    const currencyTs    = localStorage.getItem('currency_ts');
    const source        = localStorage.getItem('currency_source');
    const currencyFresh = currencyTs && Date.now() - Number(currencyTs) < CURRENCY_TTL;

    if (source === 'manual' && savedCurrency) {
      setCurrencyState(savedCurrency);
    } else if (savedCurrency && currencyFresh) {
      setCurrencyState(savedCurrency);
    } else {
      fetch('https://ipapi.co/json/')
        .then(res => res.json())
        .then(data => {
          const detected = countryToCurrency[data.country_code] || 'EGP';
          setCurrencyState(detected);
          localStorage.setItem('currency', detected);
          localStorage.setItem('currency_ts', String(Date.now()));
          localStorage.setItem('currency_source', 'auto');
        })
        .catch(() => {
          setCurrencyState(savedCurrency || 'EGP');
        });
    }

    // ── Exchange rates (THIS WAS MISSING) ──
    const RATES_TTL = 60 * 60 * 1000;
    const savedRates = localStorage.getItem('exchange_rates');
    const ratesTs = localStorage.getItem('exchange_rates_ts');
    const ratesFresh = ratesTs && Date.now() - Number(ratesTs) < RATES_TTL;

    if (savedRates && ratesFresh) {
      setRates(JSON.parse(savedRates));
    } else {
      fetch('https://api.exchangerate-api.com/v4/latest/USD')
        .then(res => res.json())
        .then(data => {
          if (data.rates) {
            setRates(data.rates);
            localStorage.setItem('exchange_rates', JSON.stringify(data.rates));
            localStorage.setItem('exchange_rates_ts', String(Date.now()));
          }
        })
        .catch(() => {
          if (savedRates) setRates(JSON.parse(savedRates));
        });
    }
  }, []);


  return (
    <CurrencyContext.Provider 
      value={{ 
        currency, 
        setCurrency, 
        formatPrice,
        wishlist,
        setWishlist 
      }}
    >
      {children}
    </CurrencyContext.Provider>
  );
}

export const useCurrency = () => {
  const context = useContext(CurrencyContext);
  if (!context) throw new Error('useCurrency must be used inside CurrencyProvider');
  return context;
};