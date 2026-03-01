'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Header from '@components/Header';
import Footer from '@components/Footer';
import { Heart, ShoppingBag } from 'lucide-react';

// Very simple client-side auth check (replace with real auth later)
const isLoggedIn = () => {
  // In real app → use context / zustand / next-auth / cookies
  return typeof window !== 'undefined' && localStorage.getItem('isLoggedIn') === 'true';
};

export default function Wishlist() {
  const router = useRouter();
  const [wishlist, setWishlist] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoggedIn()) {
      router.push('/login?redirect=/wishlist');
      return;
    }

    // Demo wishlist – in real app load from localStorage / Supabase / API
    const saved = localStorage.getItem('wishlist');
    if (saved) {
      setWishlist(JSON.parse(saved));
    }
    setLoading(false);
  }, [router]);

  const removeFromWishlist = (id: number) => {
    const updated = wishlist.filter((item) => item.id !== id);
    setWishlist(updated);
    localStorage.setItem('wishlist', JSON.stringify(updated));
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-xl">Loading...</p>
      </div>
    );
  }

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gray-50 py-16">
        <div className="max-w-6xl mx-auto px-6">
          <h1 className="text-4xl font-light tracking-widest mb-12 text-center">My Wishlist</h1>

          {wishlist.length === 0 ? (
            <div className="text-center py-20">
              <Heart size={64} className="mx-auto text-gray-300 mb-6" strokeWidth={1} />
              <p className="text-2xl text-gray-600 mb-6">Your wishlist is empty</p>
              <Link
                href="/"
                className="inline-block bg-black text-white px-10 py-4 text-sm tracking-widest rounded-full hover:bg-gray-800 transition"
              >
                CONTINUE SHOPPING
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10">
              {wishlist.map((item) => (
                <div key={item.id} className="bg-white rounded-xl overflow-hidden shadow-sm">
                  <div className="relative">
                    <img
                      src={item.img}
                      alt={item.name}
                      className="w-full aspect-3/4 object-cover"
                    />
                  </div>
                  <div className="p-6">
                    <h3 className="font-medium text-lg mb-2">{item.name}</h3>
                    <p className="text-gray-600 mb-4">{item.price}</p>
                    <div className="flex gap-4">
                      <button
                        onClick={() => removeFromWishlist(item.id)}
                        className="flex-1 border border-gray-300 py-3 rounded-lg text-sm hover:bg-gray-50 transition"
                      >
                        Remove
                      </button>
                      <button className="flex-1 bg-black text-white py-3 rounded-lg text-sm hover:bg-gray-800 transition">
                        Add to Bag
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      <Footer />
    </>
  );
}