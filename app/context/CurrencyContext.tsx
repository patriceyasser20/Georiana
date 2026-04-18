'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { supabaseClient } from '../../lib/supabaseClient';   // ← Make sure this path is correct

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
  wishlist: any[];                    // ← Added for global wishlist access
  setWishlist: React.Dispatch<React.SetStateAction<any[]>>;
};

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

const countryToCurrency: Record<string, string> = {
  EG: 'EGP', SA: 'SAR', GB: 'GBP', JP: 'JPY', US: 'USD', CA: 'CAD',
  BR: 'BRL', IN: 'INR', RU: 'RUB', CN: 'CNY', AE: 'AED', KR: 'KRW',
  // ... (your full mapping remains the same)
  FR: 'EUR', DE: 'EUR', ES: 'EUR', IT: 'EUR', NL: 'EUR', BE: 'EUR',
  AT: 'EUR', PT: 'EUR', GR: 'EUR', IE: 'EUR', FI: 'EUR', SK: 'EUR',
  SI: 'EUR', HR: 'EUR', LT: 'EUR', LV: 'EUR', EE: 'EUR', LU: 'EUR',
  MT: 'EUR', CY: 'EUR',
};

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const [currency, setCurrencyState] = useState<Currency>('EGP');
  const [rates, setRates] = useState<Record<string, number>>({});
  const [wishlist, setWishlist] = useState<any[]>([]);   // ← New state

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

  // Safe Wishlist Fetch - This stops the 406 spam
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
  }, []);   // Runs once on mount (you can change to [user?.id] if needed)

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