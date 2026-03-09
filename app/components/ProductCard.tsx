'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Heart } from 'lucide-react';
import { supabaseClient } from '../../lib/supabaseClient';
import { useCurrency } from '../context/CurrencyContext';
import { useEffect, useState } from 'react';

interface ProductCardProps {
  id: string;
  name: string;
  price: string | number;
  img: string;
  sizes?: string[];
  colors?: string[];
  isOnSale?: boolean;           // ← NEW
  discountPercentage?: number;  // ← NEW
}

export default function ProductCard({ 
  id, 
  name, 
  price, 
  img, 
  isOnSale = false, 
  discountPercentage = 0 
}: ProductCardProps) {
  const router = useRouter();
  const { formatPrice } = useCurrency();

  const [isWishlisted, setIsWishlisted] = useState(false);
  const [loading, setLoading] = useState(false);

  const discount = discountPercentage || 0;
  const salePrice = isOnSale ? Number(price) * (1 - discount / 100) : Number(price);

  // Check if this product is already in wishlist
  useEffect(() => {
    const checkWishlist = async () => {
      const { data: { user } } = await supabaseClient.auth.getUser();
      if (!user) return;

      const { data } = await supabaseClient
        .from('wishlist')
        .select('id')
        .eq('user_id', user.id)
        .eq('product_id', id)
        .single();

      setIsWishlisted(!!data);
    };

    checkWishlist();
  }, [id]);

  const toggleWishlist = async (e: React.MouseEvent) => {
    e.preventDefault();
    setLoading(true);

    const { data: { user } } = await supabaseClient.auth.getUser();

    if (!user) {
      router.push('/login');
      setLoading(false);
      return;
    }

    if (isWishlisted) {
      await supabaseClient
        .from('wishlist')
        .delete()
        .eq('user_id', user.id)
        .eq('product_id', id);
      setIsWishlisted(false);
    } else {
      await supabaseClient
        .from('wishlist')
        .insert({ user_id: user.id, product_id: id });
      setIsWishlisted(true);
    }

    setLoading(false);
  };

  return (
    <Link href={`/product/${id}`} className="group block">
      <div className="relative overflow-hidden rounded-3xl bg-white border">
        <img 
          src={img} 
          alt={name} 
          className="w-full aspect-square object-cover group-hover:scale-105 transition-transform duration-500" 
        />

        {/* Sale Badge */}
        {isOnSale && discount > 0 && (
          <div className="absolute top-4 left-4 bg-red-600 text-white text-xs font-bold px-3 py-1 rounded-full shadow-md z-10">
            -{discount}%
          </div>
        )}

        {/* Real Wishlist Button */}
        <button 
          onClick={toggleWishlist}
          disabled={loading}
          className="absolute top-4 right-4 p-2 bg-white rounded-full shadow hover:scale-110 transition z-10"
        >
          <Heart 
            size={22} 
            className={`transition-colors ${isWishlisted ? 'fill-red-500 text-red-500' : 'text-gray-700'}`} 
          />
        </button>

        <div className="p-4">
          <p className="font-medium text-lg">{name}</p>
          
          <div className="flex items-baseline gap-2 mt-1">
            {isOnSale && discount > 0 ? (
              <>
                <span className="text-xl font-medium line-through text-gray-400">
                  {formatPrice(Number(price))}
                </span>
                <span className="text-2xl font-bold text-red-600">
                  {formatPrice(salePrice)}
                </span>
              </>
            ) : (
              <span className="text-2xl font-medium">{formatPrice(Number(price))}</span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}