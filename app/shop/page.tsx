'use client';

import { useEffect, useState } from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import ProductCard from '../components/ProductCard';
import { supabaseClient } from '../../lib/supabaseClient';
import { useTranslation } from '../context/LanguageContext';

export default function Shop() {
  const { t } = useTranslation();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchAllProducts = async () => {
      const { data } = await supabaseClient
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });
      setProducts(data || []);
      setLoading(false);
    };
    fetchAllProducts();
  }, []);

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex justify-between items-center mb-10">
            <h1 className="text-5xl font-light tracking-widest">{t('shop.allProducts')}</h1>
            
            <input
              type="text"
              placeholder={t('Search')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="border border-gray-300 rounded-full px-6 py-3 w-96 focus:outline-none focus:border-black"
            />
          </div>

          {loading ? (
            <p className="text-center text-xl">{t('common.loading')}</p>
          ) : filteredProducts.length === 0 ? (
            <p className="text-center text-xl">{t('common.noResults')}</p>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
              {filteredProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  id={product.id}
                  name={product.name}
                  price={Number(product.price)}
                  img={product.images?.[0] || product.image_url || ''}
                  sizes={product.sizes || []}
                  colors={product.colors || []}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}