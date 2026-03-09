'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import ProductCard from '../../components/ProductCard';
import { supabaseClient } from '../../../lib/supabaseClient';
import { useCurrency } from '../../context/CurrencyContext';

// Safe slugify that never crashes on null/undefined
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

  const [products, setProducts] = useState<any[]>([]);
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      const { data } = await supabaseClient
        .from('products')
        .select('*');

      // Extra safe filter - skip any product with null collection
      const filtered = (data || []).filter((p: any) => {
        return slugify(p.collection) === slug;
      });

      setProducts(filtered);

      // Nice display name
      if (filtered.length > 0) {
        setDisplayName(filtered[0].collection);
      } else {
        setDisplayName(
          (slug || '')
            .replace(/-/g, ' ')
            .replace(/\b\w/g, c => c.toUpperCase())
        );
      }

      setLoading(false);
    };

    fetchProducts();
  }, [slug]);

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-7xl mx-auto px-6">
          <h1 className="text-5xl font-light tracking-widest mb-10">
            Collection — {displayName}
          </h1>

          {loading ? (
            <p className="text-center py-20">Loading...</p>
          ) : products.length === 0 ? (
            <p className="text-center py-20 text-xl text-gray-500">
              No products found in this collection.
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map((p) => (
                <ProductCard
                  key={p.id}
                  id={p.id}
                  name={p.name}
                  price={p.price}
                  img={p.images?.[0] || ''}
                />
              ))}
            </div>
          )}
        </div>
      </div>
      <Footer />
    </>
  );
}