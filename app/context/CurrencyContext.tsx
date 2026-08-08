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
  currentRate: number;
  // Kept so historical orders placed back when multi-currency was live
  // still render in the currency/rate they were actually placed in.
  formatPriceAs: (egpPrice: number, currency: Currency, rate: number) => string;
  wishlist: any[];
  setWishlist: React.Dispatch<React.SetStateAction<any[]>>;
};

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  // Currency switching is disabled — store is EGP-only now. currency/setCurrency
  // stay in the context shape so nothing else that reads them breaks, but
  // setCurrency is intentionally a no-op and currency never changes.
  const currency: Currency = 'EGP';
  const setCurrency = (_newCurrency: Currency) => {
    // no-op — currency switching disabled
  };

  const [wishlist, setWishlist] = useState<any[]>([]);

  const formatPrice = (egpPrice: number) => {
    return `${currencySymbols.EGP}${Math.round(egpPrice).toLocaleString()}`;
  };

  const currentRate = 1;

  // Still honors historical orders placed in other currencies before this
  // was disabled, so past order history doesn't break.
  const formatPriceAs = (egpPrice: number, orderCurrency: Currency, rate: number) => {
    const safeRate = rate && rate > 0 ? rate : 1;
    const converted = Math.round(egpPrice * safeRate);
    const symbol = currencySymbols[orderCurrency] || `${orderCurrency} `;
    return `${symbol}${converted.toLocaleString()}`;
  };

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