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
    const egpRate = rates.EGP;
    const targetRate = rates[currency];

    // Rates haven't loaded from the API yet — show the raw EGP amount
    // instead of a bogus divide-by-fallback conversion. Once `rates`
    // populates, this recomputes correctly on the next render.
    const converted = (egpRate && targetRate)
      ? Math.round(egpPrice * (targetRate / egpRate))
      : Math.round(egpPrice);

    const symbol = currencySymbols[currency] || `${currency} `;
    return `${symbol}${converted.toLocaleString()}`;
  };

  // The live EGP → current-currency factor, exposed so callers (like
  // checkout) can snapshot it at a point in time and persist it.
  const currentRate = (() => {
    const egpRate = rates.EGP;
    const targetRate = rates[currency];
    return (egpRate && targetRate) ? targetRate / egpRate : 1;
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

    // ── Geo/currency detection — cached 24h, failures cached 1h ──
    const GEO_CACHE_KEY = 'geoCurrencyCache';
    const GEO_CACHE_TTL = 24 * 60 * 60 * 1000; // 24h
    const GEO_FAIL_TTL = 2 * 60 * 1000; // 1h — short backoff so a
    // rate-limited/dead endpoint doesn't get hit on every single reload,
    // but recovers within an hour rather than being stuck all day.

    const cachedGeoRaw = localStorage.getItem(GEO_CACHE_KEY);
    let usedCache = false;
    if (cachedGeoRaw) {
      try {
        const cached = JSON.parse(cachedGeoRaw);
        const ttl = cached.failed ? GEO_FAIL_TTL : GEO_CACHE_TTL;
        if (Date.now() - cached.timestamp < ttl) {
          setCurrencyState(cached.currency || 'EGP');
          if (!cached.failed) localStorage.setItem('currency', cached.currency);
          usedCache = true;
        }
      } catch {
        // corrupt cache entry — ignore, fall through to refetch
      }
    }

    if (!usedCache) {
      // Guards React Strict Mode's dev-only double effect invocation —
      // without this, two fetches fire back-to-back before either one
      // finishes writing the cache, doubling real request volume.
      const w = window as any;
      if (!w.__geoFetchInFlight) {
        w.__geoFetchInFlight = true;

        fetch('https://ipapi.co/json/')
          .then(res => {
            if (!res.ok) throw new Error(`ipapi.co returned ${res.status}`);
            return res.json();
          })
          .then(data => {
            const detected = countryToCurrency[data.country_code] || 'EGP';
            setCurrencyState(detected);
            localStorage.setItem('currency', detected);
            localStorage.setItem(GEO_CACHE_KEY, JSON.stringify({
              currency: detected,
              timestamp: Date.now(),
            }));
            console.log(`🌍 Detected country: ${data.country_code} → Currency: ${detected}`);
          })
          .catch(() => {
            setCurrencyState('EGP');
            // Cache the failure so a dead/rate-limited endpoint backs off
            // for GEO_FAIL_TTL instead of retrying on every page load.
            localStorage.setItem(GEO_CACHE_KEY, JSON.stringify({
              failed: true,
              timestamp: Date.now(),
            }));
          })
          .finally(() => {
            w.__geoFetchInFlight = false;
          });
      }
    }

    // ── Exchange rates — same caching + backoff pattern ──
    const RATES_CACHE_KEY = 'exchangeRatesCache';
    const RATES_CACHE_TTL = 24 * 60 * 60 * 1000;
    const RATES_FAIL_TTL = 2 * 60 * 1000;

    const cachedRatesRaw = localStorage.getItem(RATES_CACHE_KEY);
    let usedRatesCache = false;
    if (cachedRatesRaw) {
      try {
        const cached = JSON.parse(cachedRatesRaw);
        const ttl = cached.failed ? RATES_FAIL_TTL : RATES_CACHE_TTL;
        if (Date.now() - cached.timestamp < ttl) {
          if (cached.rates) setRates(cached.rates);
          usedRatesCache = true;
        }
      } catch {
        // ignore corrupt cache
      }
    }

    if (!usedRatesCache) {
      const w = window as any;
      if (!w.__ratesFetchInFlight) {
        w.__ratesFetchInFlight = true;

        fetch('https://api.exchangerate-api.com/v4/latest/USD')
          .then(res => {
            if (!res.ok) throw new Error(`exchangerate-api returned ${res.status}`);
            return res.json();
          })
          .then(data => {
            if (data.rates) {
              setRates(data.rates);
              localStorage.setItem(RATES_CACHE_KEY, JSON.stringify({
                rates: data.rates,
                timestamp: Date.now(),
              }));
            }
          })
          .catch(() => {
            localStorage.setItem(RATES_CACHE_KEY, JSON.stringify({
              failed: true,
              timestamp: Date.now(),
            }));
          })
          .finally(() => {
            w.__ratesFetchInFlight = false;
          });
      }
    }
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