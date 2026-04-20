'use client';

import { useEffect, useState } from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import ProductCard from '../components/ProductCard';
import { supabaseClient } from '../../lib/supabaseClient';
import { Trash2 } from 'lucide-react';
import Link from 'next/link';

export default function WishlistPage() {
  const [wishlistItems, setWishlistItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchWishlist();
  }, []);

  const fetchWishlist = async () => {
    try {
      setLoading(true);

      const { data: { user } } = await supabaseClient.auth.getUser();

      if (!user) {
        setWishlistItems([]);
        return;
      }

      const { data, error } = await supabaseClient
        .from('wishlist')
        .select(`
          id,
          product_id,
          products (
            id,
            name,
            price,
            images,
            is_on_sale,
            discount_percentage
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching wishlist:', error);
        setWishlistItems([]);
        return;
      }

      const validItems = (data || []).filter(item => item.products);

      setWishlistItems(validItems);
    } catch (err) {
      console.error('Wishlist fetch error:', err);
      setWishlistItems([]);
    } finally {
      setLoading(false);
    }
  };

  const removeFromWishlist = async (wishlistRowId: string) => {
    const previousItems = [...wishlistItems];

    // ✅ Optimistic UI update
    const updatedItems = wishlistItems.filter(
      item => item.id !== wishlistRowId
    );

    setWishlistItems(updatedItems);

    try {
      const { error } = await supabaseClient
        .from('wishlist')
        .delete()
        .eq('id', wishlistRowId);

      if (error) {
        console.error('Delete error:', error);
        setWishlistItems(previousItems); // rollback
      }
    } catch (err) {
      console.error('Unexpected delete error:', err);
      setWishlistItems(previousItems); // rollback
    }
  };

  return (
    <>
      <Header />
      <div>H!</div>
      <div>H!</div>
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-7xl mx-auto px-6">
          <h1 className="text-5xl font-light tracking-widest mb-10">Wishlist</h1>

          {loading ? (
            <p className="text-center py-20 text-xl">Loading your wishlist...</p>
          ) : wishlistItems.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-2xl text-gray-500 mb-6">Your wishlist is empty</p>
              <Link 
                href="/shop" 
                className="inline-block bg-black text-white px-10 py-4 rounded-full text-sm tracking-widest hover:bg-gray-800"
              >
                Browse Products
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {wishlistItems.map((item) => {
                const p = item.products;
                if (!p) return null;

                return (
                  <div
                    key={`${item.id}-${item.product_id}`} // ✅ FIXED KEY
                    className="relative group"
                  >
                    <ProductCard
                      id={p.id}
                      name={p.name}
                      price={p.price}
                      img={p.images?.[0] || ''}
                      isOnSale={p.is_on_sale}
                      discountPercentage={p.discount_percentage}
                      onRemove={() => removeFromWishlist(item.id)} // ✅ THIS IS CRUCIAL
                    />

                    <button
                      onClick={() => removeFromWishlist(item.id)}
                      className="absolute top-4 right-4 bg-white p-2 rounded-full shadow hover:bg-red-50 hover:text-red-600 transition"
                    >
                      <Trash2 size={20} />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
      <Footer />
    </>
  );
}