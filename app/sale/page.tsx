'use client';

import { useEffect, useState } from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import ProductCard from '../components/ProductCard';
import { supabaseClient } from '../../lib/supabaseClient';
import { useTranslation } from '../context/LanguageContext';
import { ProductCardSkeleton } from '../components/Skeleton';

export default function SalePage() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { t } = useTranslation();

  useEffect(() => {
    const fetchSaleProducts = async () => {
      const { data } = await supabaseClient
        .from('products')
        .select('*')
        .eq('is_on_sale', true)
        .order('created_at', { ascending: false });

      setProducts(data || []);
      setLoading(false);
    };
    fetchSaleProducts();
  }, []);

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gray-50 py-25">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center gap-4 mb-12">
            <h1 className="text-5xl font-light tracking-widest text-red-600">{t('sale.SALE')}</h1>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {Array.from({ length: 8 }).map((_, i) => <ProductCardSkeleton key={i} />)}
            </div>
          ) : products.length === 0 ? (
            <p className="text-center py-20 text-xl text-gray-500">No items on sale right now. Check back soon!</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {products.map((p) => (
                <ProductCard
                  key={p.id}
                  id={p.id}
                  name={p.name}
                  price={p.price}
                  img={p.images?.[0] || ''}
                  isOnSale={p.is_on_sale}
                  discountPercentage={p.discount_percentage}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}