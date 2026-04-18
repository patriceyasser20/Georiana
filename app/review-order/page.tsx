'use client';

import { useEffect, useState } from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { Trash2, Plus, Minus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useCurrency } from '../context/CurrencyContext';
import { useTranslation } from '../context/LanguageContext';

export default function ReviewOrder() {
  const router = useRouter();
  const { formatPrice } = useCurrency();
  const { t } = useTranslation();

  const [items, setItems] = useState<any[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem('reviewOrder');
    if (saved) setItems(JSON.parse(saved));
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

  const proceedToCheckout = () => {
    if (items.length === 0) return;
    router.push('/checkout');
  };

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gray-50 py-12">
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
                    <p className="text-gray-600 mt-1">{formatPrice(Number(item.price))}</p>
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
                <p className="text-3xl font-medium">{t('reviewOrder.total')} {formatPrice(total)}</p>
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
      <Footer />
    </>
  );
}