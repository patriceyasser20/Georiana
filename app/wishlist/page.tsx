'use client';

import { useEffect, useState } from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import ProductCard from '../components/ProductCard';
import { supabaseClient } from '../../lib/supabaseClient';
import { Trash2 } from 'lucide-react';

export default function WishlistPage() {
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
          *,
          products (
            id,
            name,
            price,
            images,
            is_on_sale,
            discount_percentage
          )
        `)
        .eq('user_id', user.id);

      setWishlistItems(data || []);
      setLoading(false);
    };

    fetchWishlist();
  }, []);

  const removeFromWishlist = async (productId: string) => {
    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) return;

    await supabaseClient
      .from('wishlist')
      .delete()
      .eq('user_id', user.id)
      .eq('product_id', productId);

    setWishlistItems(prev => prev.filter(item => item.product_id !== productId));
  };

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-7xl mx-auto px-6">
          <h1 className="text-5xl font-light tracking-widest mb-10">Wishlist</h1>

          {loading ? (
            <p className="text-center py-20">Loading wishlist...</p>
          ) : wishlistItems.length === 0 ? (
            <p className="text-center py-20 text-xl text-gray-500">Your wishlist is empty.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {wishlistItems.map((item) => {
                const p = item.products;
                return (
                  <div key={item.id} className="relative group">
                    <ProductCard
                      id={p.id}
                      name={p.name}
                      price={p.price}
                      img={p.images?.[0] || ''}
                      isOnSale={p.is_on_sale}                    // ← Sale support
                      discountPercentage={p.discount_percentage}  // ← Sale support
                    />

                    {/* Remove button */}
                    <button
                      onClick={() => removeFromWishlist(p.id)}
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