'use client';

import { useState } from 'react';
import { Heart } from 'lucide-react';
import QuickViewModal from './QuickViewModal';
import { supabaseClient } from '../../lib/supabaseClient';

interface ProductCardProps {
  id: string;
  name: string;
  price: string;
  img: string;
  sizes?: string[];
  colors?: string[];
}

export default function ProductCard({ 
  id, 
  name, 
  price, 
  img, 
  sizes = ['S','M','L','XL'], 
  colors = ['Black','Brown','Navy'] 
}: ProductCardProps) {
  const [isQuickViewOpen, setIsQuickViewOpen] = useState(false);
  const [isWishlisted, setIsWishlisted] = useState(false);

  const toggleWishlist = async () => {
    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) {
      alert("Please sign in to use wishlist");
      return;
    }
    setIsWishlisted(!isWishlisted);
  };

  return (
    <>
      <div className="product-card group cursor-pointer">
        <div className="relative overflow-hidden">
          <img 
            src={img} 
            alt={name} 
            className="w-full aspect-3/4 object-cover transition-transform duration-500 group-hover:scale-105" 
          />
          
          <button onClick={toggleWishlist} className="absolute top-4 right-4 z-10">
            <Heart size={24} fill={isWishlisted ? "red" : "none"} stroke={isWishlisted ? "red" : "white"} />
          </button>

          <button 
            onClick={() => setIsQuickViewOpen(true)} 
            className="quick-view absolute bottom-6 left-1/2 -translate-x-1/2 bg-black text-white px-8 py-3 text-xs tracking-widest opacity-0 group-hover:opacity-100 transition-all duration-300"
          >
            QUICK VIEW
          </button>
        </div>

        <div className="pt-5 text-center">
          <p className="font-medium text-sm">{name}</p>
          <p className="text-sm mt-1 text-gray-600">{price}</p>
        </div>
      </div>

      <QuickViewModal
        id={id}
        name={name}
        price={price}
        img={img}
        sizes={sizes}
        colors={colors}
        isOpen={isQuickViewOpen}
        onClose={() => setIsQuickViewOpen(false)}
      />
    </>
  );
}