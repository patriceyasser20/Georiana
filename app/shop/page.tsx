'use client';

import { useEffect, useState } from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import ProductCard from '../components/ProductCard';
import { supabaseClient } from '../../lib/supabaseClient';

export default function ShopPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-7xl mx-auto px-6">
          <h1 className="text-5xl font-light tracking-widest mb-10">Shop All</h1>

          {loading ? (
            <p className="text-center py-20">Loading products...</p>
          ) : products.length === 0 ? (
            <p className="text-center py-20 text-xl text-gray-500">No products yet.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {products.map((p) => (
                <ProductCard
                  key={p.id}
                  id={p.id}
                  name={p.name}
                  price={p.price}
                  img={p.images?.[0] || ''}
                  isOnSale={p.is_on_sale}                    // ← Sale support
                  discountPercentage={p.discount_percentage}  // ← Sale support
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}