'use client';

import { useEffect, useState } from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { Trash2, Heart } from 'lucide-react';
import Link from 'next/link';

export default function Wishlist() {
  const [wishlist, setWishlist] = useState<any[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem('wishlist');
    if (saved) setWishlist(JSON.parse(saved));
  }, []);

  const removeFromWishlist = (id: string) => {
    const updated = wishlist.filter(item => item.id !== id);
    setWishlist(updated);
    localStorage.setItem('wishlist', JSON.stringify(updated));
  };

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-6xl mx-auto px-6">
          <h1 className="text-4xl font-light tracking-widest mb-10 flex items-center gap-3">
            <Heart size={32} /> My Wishlist
          </h1>

          {wishlist.length === 0 ? (
            <div className="text-center py-20">
              <Heart size={80} className="mx-auto text-gray-300 mb-6" />
              <p className="text-2xl text-gray-500">Your wishlist is empty</p>
              <Link href="/shop" className="mt-6 inline-block bg-black text-white px-10 py-4 rounded-full text-sm tracking-widest">
                Browse Products
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {wishlist.map(item => (
                <div key={item.id} className="bg-white rounded-3xl overflow-hidden border">
                  <img src={item.image_url} alt={item.name} className="w-full h-80 object-cover" />
                  <div className="p-6">
                    <h3 className="font-medium text-lg mb-1">{item.name}</h3>
                    <p className="text-xl font-medium">EGP {item.price}</p>
                    <button 
                      onClick={() => removeFromWishlist(item.id)}
                      className="mt-6 flex items-center gap-2 text-red-600 hover:text-red-700"
                    >
                      <Trash2 size={18} /> Remove from Wishlist
                    </button>
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