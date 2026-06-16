'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import ProductCard from '../../components/ProductCard';
import { supabaseClient } from '../../../lib/supabaseClient';
import { useCurrency } from '../../context/CurrencyContext';
import { getCached, setCached } from '../../../lib/productCache';

const slugify = (text: string) => 
  text.toLowerCase().trim().replace(/\s+/g, '-').replace(/[^\w-]+/g, '');

export default function WomanCategoryPage() {
  const { category } = useParams();
  const { formatPrice } = useCurrency();

  const [products, setProducts] = useState<any[]>([]);
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      const cacheKey = `category-${category}`; // ← backticks, not single quotes

      const cached = getCached(cacheKey);
      if (cached) {
        setProducts(cached);
        setDisplayName(cached[0]?.category || String(category));
        setLoading(false);
        return;
      }

      const { data, error } = await supabaseClient
        .from('products')
        .select(`
          id, name, price, images, is_on_sale, discount_percentage, category, description,
          product_variants (is_on_sale, discount_percentage)
        `)
        .order('created_at', { ascending: false });

      // Filter by category slug after fetch
      const filtered = (data || []).filter(
        (p: any) => slugify(p.category) === category
      );

      if (!error) {
        setCached(cacheKey, filtered);
        setProducts(filtered);
        setDisplayName(filtered[0]?.category || String(category));
      }

      setLoading(false);
    };

    fetchProducts();
  }, [category]);

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gray-50 py-22">
        <div className="max-w-7xl mx-auto px-6">
          <h1 className="text-5xl font-light tracking-widest mb-10">
            Women — {displayName}
          </h1>

          {loading ? (
            <p className="text-center py-20">Loading...</p>
          ) : products.length === 0 ? (
            <p className="text-center py-20 text-xl text-gray-500">No products in this category yet.</p>
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