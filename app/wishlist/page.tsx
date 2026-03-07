'use client';

import { useEffect, useState } from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { supabaseClient } from '../../lib/supabaseClient';
import { Trash2, Heart } from 'lucide-react';
import { useCurrency } from '../context/CurrencyContext';
import Link from 'next/link';

export default function Wishlist() {
  const { formatPrice } = useCurrency();
  const [wishlistItems, setWishlistItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadWishlist();
  }, []);

  const loadWishlist = async () => {
    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) {
      setWishlistItems([]);
      setLoading(false);
      return;
    }

    const { data } = await supabaseClient
      .from('wishlist')
      .select(`
        *,
        products (
          id,
          name,
          price,
          images
        )
      `)
      .eq('user_id', user.id);

    setWishlistItems(data || []);
    setLoading(false);
  };

  const removeFromWishlist = async (id: string) => {
    await supabaseClient.from('wishlist').delete().eq('id', id);
    loadWishlist();
  };

  if (loading) return <p className="text-center py-20">Loading wishlist...</p>;

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-6xl mx-auto px-6">
          <h1 className="text-5xl font-light tracking-widest mb-10">Your Wishlist</h1>

          {wishlistItems.length === 0 ? (
            <p className="text-center py-20 text-xl text-gray-500">Your wishlist is empty ❤️</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {wishlistItems.map((item) => (
                <Link
                  key={item.id}
                  href={`/product/${item.products.id}`}
                  className="group block"
                >
                  <div className="relative overflow-hidden rounded-3xl bg-white border transition-all hover:shadow-xl">
                    {item.products?.images?.[0] && (
                      <img
                        src={item.products.images[0]}
                        alt={item.products.name}
                        className="w-full aspect-square object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    )}

                    {/* Filled Red Heart (same as home page) */}
                    <div className="absolute top-4 right-4 p-2 bg-white rounded-full shadow">
                      <Heart size={22} className="text-red-500 fill-red-500" />
                    </div>

                    <div className="p-6">
                      <p className="font-medium text-lg">{item.products?.name}</p>
                      <p className="text-xl font-medium mt-1">
                        {formatPrice(item.products?.price)}
                      </p>

                      {/* Remove Button - matches home page style */}
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          removeFromWishlist(item.id);
                        }}
                        className="mt-6 w-full flex items-center justify-center gap-2 text-red-600 hover:text-red-700 py-3 border border-red-200 rounded-xl hover:bg-red-50 transition"
                      >
                        <Trash2 size={18} /> Remove
                      </button>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}