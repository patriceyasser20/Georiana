'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Header from '../../components/Header';
import ProductCard from '../../components/ProductCard';
import { supabaseClient } from '../../../lib/supabaseClient';
import { useCurrency } from '../../context/CurrencyContext';
import { getCached, setCached } from '../../../lib/productCache';
import { useTranslation } from '../../context/LanguageContext';

const slugify = (text: string) => 
  text.toLowerCase().trim().replace(/\s+/g, '-').replace(/[^\w-]+/g, '');

export default function WomanCategoryPage() {
  const { category } = useParams();
  const { formatPrice } = useCurrency();

  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { t } = useTranslation();

  useEffect(() => {
    const fetchProducts = async () => {
      const cacheKey = `category-${category}`; // ← backticks, not single quotes

      const cached = getCached(cacheKey);
      if (cached) {
        setProducts(cached);
        setLoading(false);
        return;
      }

      const { data, error } = await supabaseClient
        .from('products')
        .select('id, name, price, images, is_on_sale, discount_percentage, category, collection, collection_ar')
        .order('created_at', { ascending: false });

      // Filter by category slug after fetch
      const filtered = (data || []).filter(
        (p: any) => slugify(p.category) === category
      );

      if (!error) {
        setCached(cacheKey, filtered);
        setProducts(filtered);
      }

      setLoading(false);
    };

    fetchProducts();
  }, [category]);
  const categorySlug = String(category);
  const translatedCategory = t(`category.${categorySlug}`);
  const displayName = translatedCategory !== `category.${categorySlug}`
    ? translatedCategory
    : categorySlug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gray-50 py-22">
        <div className="max-w-7xl mx-auto px-6">
          <h1 className="text-5xl font-light tracking-widest mb-10">
            {t('header.woman')} — {displayName}
          </h1>

          {loading ? (
            <p className="text-center py-20">{t('common.loading')}</p>
          ) : products.length === 0 ? (
            <p className="text-center py-20 text-xl text-gray-500">{t('common.noCategories')}</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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