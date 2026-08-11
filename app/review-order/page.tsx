'use client';

import { useEffect, useState } from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { Trash2, Plus, Minus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useCurrency } from '../context/CurrencyContext';
import { useTranslation } from '../context/LanguageContext';
import { supabaseClient } from '../../lib/supabaseClient';
import { calculateAllOffers, type Offer } from '../../lib/offers';

export default function ReviewOrder() {
  const router = useRouter();
  const { formatPrice } = useCurrency();
  const { t } = useTranslation();

  const [items, setItems] = useState<any[]>([]);
  const [offers, setOffers] = useState<Offer[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem('reviewOrder');
    if (saved) setItems(JSON.parse(saved));
  }, []);

  useEffect(() => {
    const fetchOffers = async () => {
      const { data } = await supabaseClient
        .from('offers')
        .select('*')
        .eq('is_active', true);
      setOffers((data || []) as Offer[]);
    };
    fetchOffers();
  }, []);

  const updateQuantity = (index: number, newQty: number) => {
    if (newQty < 1) return;
    const newItems = [...items];
    newItems[index].quantity = newQty;
    setItems(newItems);
    localStorage.setItem('reviewOrder', JSON.stringify(newItems));
  };

  const removeItem = (index: number) => {
    const newItems = items.filter((_, i) => i !== index);
    setItems(newItems);
    localStorage.setItem('reviewOrder', JSON.stringify(newItems));
  };

  const total = items.reduce((sum, item) => sum + Number(item.price) * Number(item.quantity), 0);
  const originalTotal = items.reduce((sum, item) => sum + Number(item.originalPrice || item.price) * Number(item.quantity), 0);
  const totalSavings = originalTotal - total;

  const { results: offerResults, totalDiscount: offersDiscount } = calculateAllOffers(items, offers);
  const finalTotalWithOffers = total - offersDiscount;

  const proceedToCheckout = () => {
    if (items.length === 0) return;
    router.push('/checkout');
  };

  return (
    <>

      <div className="min-h-screen bg-gray-50 py-19">
        <div className="max-w-6xl mx-auto px-6">
          <Link href="/" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-black mb-6">
            ← {t('common.continueShopping')}
          </Link>

          <h1 className="text-4xl font-light tracking-widest mb-8">{t('reviewOrder.title')}</h1>

          {items.length === 0 ? (
            <p className="text-center text-xl py-20">{t('reviewOrder.empty')}</p>
          ) : (
            <>
              {items.map((item, index) => (
                <div key={index} className="flex items-center gap-6 border-b py-8">
                  <img src={item.image_url} alt={item.name} className="w-28 h-28 object-cover rounded-xl" />
                  <div className="flex-1">
                    <p className="font-medium text-lg">{item.name}</p>
                    <p className="text-sm text-gray-500">Size: {item.size} • Color: {item.color}</p>
                    {item.isOnSale && item.originalPrice ? (
                      <div className="flex items-center gap-2 mt-1">
                        <span className="line-through text-gray-400 text-sm">{formatPrice(Number(item.originalPrice))}</span>
                        <span className="text-red-600 font-semibold">{formatPrice(Number(item.price))}</span>
                        <span className="bg-red-100 text-red-600 text-xs font-bold px-2 py-0.5 rounded-full">-{item.discountPercentage}%</span>
                      </div>
                    ) : (
                      <p className="text-gray-600 mt-1">{formatPrice(Number(item.price))}</p>
                    )}
                  </div>

                  <div className="flex items-center gap-4">
                    <button onClick={() => updateQuantity(index, item.quantity - 1)}><Minus size={20} /></button>
                    <span className="w-8 text-center font-medium">{item.quantity}</span>
                    <button onClick={() => updateQuantity(index, item.quantity + 1)}><Plus size={20} /></button>
                  </div>

                  <button onClick={() => removeItem(index)} className="text-red-600 hover:text-red-700">
                    <Trash2 size={22} />
                  </button>
                </div>
              ))}

              <div className="mt-12 border-t pt-8 text-right">
                {totalSavings > 0 && (
                  <div className="flex justify-end items-center gap-3 mb-3">
                    <span className="text-gray-400 line-through text-xl">{formatPrice(originalTotal)}</span>
                    <span className="bg-red-100 text-red-600 text-sm font-bold px-3 py-1 rounded-full">
                      You save {formatPrice(totalSavings)}
                    </span>
                  </div>
                )}

                {offerResults.length > 0 && (
                  <div className="mt-2 mb-6 space-y-2">
                    {offerResults.map((r, i) => (
                      <div
                        key={i}
                        className="flex justify-between items-center bg-emerald-50 border border-emerald-200 rounded-2xl px-5 py-3"
                      >
                        <span className="text-emerald-700 text-sm font-medium">🏷️ {r.offerApplied?.name}</span>
                        <span className="text-emerald-700 font-semibold">-{formatPrice(r.totalDiscount)}</span>
                      </div>
                    ))}
                  </div>
                )}

                <p className="text-3xl font-medium">{t('reviewOrder.total')} {formatPrice(finalTotalWithOffers)}</p>
                <button
                  onClick={proceedToCheckout}
                  className="mt-8 bg-black text-white px-16 py-5 rounded-full text-sm tracking-widest hover:bg-gray-800 transition"
                >
                  {t('reviewOrder.proceed')}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}