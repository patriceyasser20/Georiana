'use client';

import { useState, useEffect } from 'react';
import { Heart } from 'lucide-react';
import Link from 'next/link';

interface ProductCardProps {
  id: string;
  name: string;
  price: string | number;
  img: string;
  sizes?: string[];
  colors?: string[];
}

export default function ProductCard({ id, name, price, img, sizes = [], colors = [] }: ProductCardProps) {
  const [isInWishlist, setIsInWishlist] = useState(false);

  useEffect(() => {
    const wishlist = JSON.parse(localStorage.getItem('wishlist') || '[]');
    setIsInWishlist(wishlist.some((item: any) => item.id === id));
  }, [id]);

  const toggleWishlist = (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent navigation

    let wishlist = JSON.parse(localStorage.getItem('wishlist') || '[]');

    if (isInWishlist) {
      wishlist = wishlist.filter((item: any) => item.id !== id);
    } else {
      wishlist.push({
        id,
        name,
        price: Number(price),
        image_url: img,
        sizes,
        colors
      });
    }

    localStorage.setItem('wishlist', JSON.stringify(wishlist));
    setIsInWishlist(!isInWishlist);
  };

  return (
    <Link href={`/product/${id}`} className="group block">
      <div className="relative overflow-hidden rounded-3xl bg-white border">
        <img 
          src={img} 
          alt={name} 
          className="w-full aspect-square object-cover group-hover:scale-105 transition-transform duration-500" 
        />

        {/* Heart Button */}
        <button 
          onClick={toggleWishlist}
          className="absolute top-4 right-4 p-2 bg-white rounded-full shadow hover:scale-110 transition"
        >
          <Heart 
            size={22} 
            className={isInWishlist ? "fill-red-500 text-red-500" : "text-gray-700"} 
          />
        </button>

        <div className="p-4">
          <p className="font-medium text-lg">{name}</p>
          <p className="text-xl font-medium">EGP {price}</p>
        </div>
      </div>
    </Link>
  );
}