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
  // The conversion factor from EGP to the currently selected currency
  // (i.e. targetRate / egpRate). Exposed so a checkout flow can snapshot
  // "what rate was active when this order was placed" and store it,
  // instead of only ever being able to format at today's live rate.
  currentRate: number;
  // Formats an EGP amount using an explicit currency + rate, instead of
  // the live selection — used to show historical orders in the currency
  // they were actually placed in, even if the shopper has since switched
  // their display currency or rates have moved since then.
  formatPriceAs: (egpPrice: number, currency: Currency, rate: number) => string;
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

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const [currency, setCurrencyState] = useState<Currency>('EGP');
  const [rates, setRates] = useState<Record<string, number>>({});
  const [wishlist, setWishlist] = useState<any[]>([]);

  const setCurrency = (newCurrency: Currency) => {
    setCurrencyState(newCurrency);
    localStorage.setItem('currency', newCurrency);
  };

  const formatPrice = (egpPrice: number) => {
    const egpRate = rates.EGP || 48.5;
    const targetRate = rates[currency] || 1;
    const converted = Math.round(egpPrice * (targetRate / egpRate));
    const symbol = currencySymbols[currency] || `${currency} `;
    return `${symbol}${converted.toLocaleString()}`;
  };

  // The live EGP → current-currency factor, exposed so callers (like
  // checkout) can snapshot it at a point in time and persist it.
  const currentRate = (() => {
    const egpRate = rates.EGP || 48.5;
    const targetRate = rates[currency] || 1;
    return targetRate / egpRate;
  })();

  // Formats using an explicit currency + rate rather than the live
  // selection/rates — used to render historical orders in the currency
  // they were actually placed in.
  const formatPriceAs = (egpPrice: number, orderCurrency: Currency, rate: number) => {
    const safeRate = rate && rate > 0 ? rate : 1;
    const converted = Math.round(egpPrice * safeRate);
    const symbol = currencySymbols[orderCurrency] || `${orderCurrency} `;
    return `${symbol}${converted.toLocaleString()}`;
  };

  // Auto-detect country + fetch exchange rates
  useEffect(() => {
    const saved = localStorage.getItem('currency');
    if (saved === 'USD') localStorage.removeItem('currency');

    fetch('https://ipapi.co/json/')
      .then(res => res.json())
      .then(data => {
        const detected = countryToCurrency[data.country_code] || 'EGP';
        setCurrencyState(detected);
        localStorage.setItem('currency', detected);
        console.log(`🌍 Detected country: ${data.country_code} → Currency: ${detected}`);
      })
      .catch(() => setCurrencyState('EGP'));

    fetch('https://api.exchangerate-api.com/v4/latest/USD')
      .then(res => res.json())
      .then(data => {
        if (data.rates) setRates(data.rates);
      })
      .catch(() => {});
  }, []);

  // Safe Wishlist Fetch
  useEffect(() => {
    const fetchWishlist = async () => {
      const { data: { user } } = await supabaseClient.auth.getUser();
      if (!user?.id) {
        setWishlist([]);
        return;
      }

      const { data, error } = await supabaseClient
        .from('wishlist')
        .select(`
          id,
          product_id,
          created_at,
          products (
            id,
            name,
            price,
            images,
            is_on_sale,
            discount_percentage
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Wishlist fetch error in context:', error);
        setWishlist([]);
        return;
      }

      setWishlist(data || []);
    };

    fetchWishlist();
  }, []);

  return (
    <CurrencyContext.Provider 
      value={{ 
        currency, 
        setCurrency, 
        formatPrice,
        currentRate,
        formatPriceAs,
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