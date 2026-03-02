'use client';

import { useEffect, useState } from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import ProductCard from '../components/ProductCard';
import { supabaseClient } from '../../lib/supabaseClient';

export default function Wishlist() {
  const [wishlistItems, setWishlistItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchWishlist = async () => {
      const { data: { user } } = await supabaseClient.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      const { data } = await supabaseClient
        .from('wishlist')
        .select(`
          id,
          product:products (*)
        `)
        .eq('user_id', user.id);

      setWishlistItems(data || []);
      setLoading(false);
    };

    fetchWishlist();
  }, []);

  if (loading) return <div className="text-center py-20">Loading wishlist...</div>;

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-7xl mx-auto px-6">
          <h1 className="text-4xl font-light tracking-widest mb-10">My Wishlist</h1>

          {wishlistItems.length === 0 ? (
            <p className="text-center text-xl text-gray-500">Your wishlist is empty</p>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
              {wishlistItems.map(item => (
                <ProductCard
                  key={item.product.id}
                  id={item.product.id}
                  name={item.product.name}
                  price={`EGP ${item.product.price}`}
                  img={item.product.image_url}
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