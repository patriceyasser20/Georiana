'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Heart } from 'lucide-react';
import { supabaseClient } from '../../lib/supabaseClient';
import { useCurrency } from '../context/CurrencyContext';   // ← Added

interface ProductCardProps {
  id: string;
  name: string;
  price: string | number;
  img: string;
  sizes?: string[];
  colors?: string[];
}

export default function ProductCard({ id, name, price, img }: ProductCardProps) {
  const router = useRouter();
  const { formatPrice } = useCurrency();   // ← Added (auto-detects USD/EUR/EGP/etc.)

  const handleHeartClick = async (e: React.MouseEvent) => {
    e.preventDefault();

    const { data: { user } } = await supabaseClient.auth.getUser();

    if (!user) {
      router.push('/login');
    } else {
      alert('Wishlist feature coming soon!');
    }
  };

  return (
    <Link href={`/product/${id}`} className="group block">
      <div className="relative overflow-hidden rounded-3xl bg-white border">
        <img 
          src={img} 
          alt={name} 
          className="w-full aspect-square object-cover group-hover:scale-105 transition-transform duration-500" 
        />

        {/* Heart Button - Redirects to Login */}
        <button 
          onClick={handleHeartClick}
          className="absolute top-4 right-4 p-2 bg-white rounded-full shadow hover:scale-110 transition"
        >
          <Heart size={22} className="text-gray-700" />
        </button>

        <div className="p-4">
          <p className="font-medium text-lg">{name}</p>
          <p className="text-xl font-medium">{formatPrice(Number(price))}</p>   {/* ← Now dynamic currency */}
        </div>
      </div>
    </Link>
  );
}