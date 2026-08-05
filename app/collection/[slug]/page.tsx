'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Header from '../../components/Header';
import ProductCard from '../../components/ProductCard';
import { supabaseClient } from '../../../lib/supabaseClient';
import { useCurrency } from '../../context/CurrencyContext';
import { getCached, setCached } from '../../../lib/productCache';
import { useTranslation } from '../../context/LanguageContext';

const slugify = (text: string | null | undefined): string => {
  if (!text) return '';
  return text
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]+/g, '');
};

export default function CollectionPage() {
  const { slug } = useParams() as { slug: string };
  const { formatPrice } = useCurrency();
  const { t } = useTranslation();
  const [products, setProducts] = useState<any[]>([]);
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      const cacheKey = `collection-${slug}`;

      const cached = getCached(cacheKey);
      if (cached) {
        setProducts(cached);
        setDisplayName(cached[0]?.collection || slug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()));
        setLoading(false);
        return;
      }

      const { data, error } = await supabaseClient
        .from('products')
        .select(`
          id, name, price, images, is_on_sale, discount_percentage, category, description, collection,
          product_variants (is_on_sale, discount_percentage)
        `)
        .order('created_at', { ascending: false });

      // Filter by collection slug
      const filtered = (data || []).filter(
        (p: any) => slugify(p.collection) === slug
      );

      if (!error) {
        setCached(cacheKey, filtered);
        setProducts(filtered);
        setDisplayName(
          filtered[0]?.collection ||
          slug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
        );
      }

      setLoading(false);
    };

    fetchProducts();
  }, [slug]);

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gray-50 py-22">
        <div className="max-w-7xl mx-auto px-6">
          <h1 className="text-5xl font-light tracking-widest mb-10">
            {t('collection.label')} — <bdi>{displayName}</bdi>
          </h1>

          {loading ? (
            <p className="text-center py-20">{t('common.loading')}</p>
          ) : products.length === 0 ? (
            <p className="text-center py-20 text-xl text-gray-500">
              {t('collection.noProducts')}
            </p>
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
                  hasVariantSale={p.product_variants?.some((v: any) => v.is_on_sale)}
                  maxVariantDiscount={Math.max(...(p.product_variants?.filter((v: any) => v.is_on_sale).map((v: any) => v.discount_percentage) || [0]))}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}