'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Heart } from 'lucide-react';
import { supabaseClient } from '../../lib/supabaseClient';
import { useCurrency } from '../context/CurrencyContext';
import { useEffect, useState } from 'react';
import { findOfferForProduct, offerBadgeText, type Offer } from '../../lib/offers';
import Image from 'next/image';

interface ProductCardProps {
  id: string;
  name: string;
  price: string | number;
  img: string;
  isOnSale?: boolean;
  discountPercentage?: number;
  hasVariantSale?: boolean;
  maxVariantDiscount?: number;
  onRemove?: (productId: string) => void;
  category?: string;
  collection?: string;
  offers?: Offer[];
}

export default function ProductCard({
  id,
  name,
  price,
  img,
  isOnSale = false,
  discountPercentage = 0,
  hasVariantSale = false,
  maxVariantDiscount = 0,
  onRemove,
  category,
  collection,
  offers = [],
}: ProductCardProps) {
  const router = useRouter();
  const { formatPrice } = useCurrency();

  const [isWishlisted, setIsWishlisted] = useState(false);
  const [loading, setLoading] = useState(false);

  const discount = discountPercentage || 0;
  const salePrice = isOnSale ? Number(price) * (1 - discount / 100) : Number(price);

  const activeOffer = findOfferForProduct({ id, category, collection }, offers);
  const hasSaleBadge = (isOnSale && discount > 0) || (!isOnSale && hasVariantSale && maxVariantDiscount > 0);

  // Check if this product is already in wishlist
  useEffect(() => {
    let mounted = true;

    const checkWishlist = async () => {
      try {
        const { data: { user } } = await supabaseClient.auth.getUser();
        if (!user || !mounted) return;

        const { data, error } = await supabaseClient
          .from('wishlist')
          .select('id')
          .eq('user_id', user.id)
          .eq('product_id', id)
          .maybeSingle();

        if (error) {
          console.error('Wishlist check error:', error);
          return;
        }

        if (mounted) {
          setIsWishlisted(!!data);
        }
      } catch (err) {
        console.error('Wishlist check failed:', err);
      }
    };

    checkWishlist();

    return () => {
      mounted = false;
    };
  }, [id]);

  const toggleWishlist = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    setLoading(true);

    try {
      const { data: { user } } = await supabaseClient.auth.getUser();

      if (!user) {
        router.push('/login');
        return;
      }

      if (isWishlisted) {
        const { error } = await supabaseClient
          .from('wishlist')
          .delete()
          .eq('user_id', user.id)
          .eq('product_id', id);

        if (error) throw error;

        setIsWishlisted(false);
        window.dispatchEvent(new Event('wishlistUpdated'));

        if (onRemove) {
          onRemove(id);
        }

      } else {
        const { error } = await supabaseClient
          .from('wishlist')
          .insert({
            user_id: user.id,
            product_id: id
          });

        if (error) throw error;

        setIsWishlisted(true);
        window.dispatchEvent(new Event('wishlistUpdated'));
      }

    } catch (err: any) {
      console.error('Wishlist error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Link href={`/product/${id}`} className="group block">
      <div className="flex flex-col h-full relative overflow-hidden rounded-3xl bg-white border">
        <div className="relative w-full aspect-[4/5] overflow-hidden">
          {img ? (
            <Image
              src={img}
              alt={name}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              className="object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className="w-full h-full bg-gray-100" />
          )}
        </div>

        {(isOnSale && discount > 0) && (
          <div className="absolute top-4 left-4 bg-red-600 text-white text-xs font-bold px-3 py-1 rounded-full shadow-md z-10">
            -{discount}%
          </div>
        )}
        {(!isOnSale || discount === 0) && hasVariantSale && maxVariantDiscount > 0 && (
          <div className="absolute top-4 left-4 bg-orange-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-md z-10">
            Up to -{maxVariantDiscount}%
          </div>
        )}

        {activeOffer && (
          <div
            className="absolute left-4 bg-emerald-600 text-white text-xs font-bold px-3 py-1 rounded-full shadow-md z-10"
            style={{ top: hasSaleBadge ? '3.25rem' : '1rem' }}
          >
            {offerBadgeText(activeOffer)}
          </div>
        )}

        <button
          onClick={toggleWishlist}
          disabled={loading}
          className="absolute top-4 right-4 p-2 bg-white rounded-full shadow hover:bg-red-50 hover:scale-110 transition z-10"
        >
          <Heart
            size={22}
            className={isWishlisted ? 'fill-red-500 text-red-500' : 'text-gray-700'}
          />
        </button>

        <div className="p-4">
          <p className="font-medium text-lg">{name}</p>

          <div className="flex items-baseline gap-2 mt-1">
            {isOnSale && discount > 0 ? (
              <>
                <span className="text-xl line-through text-gray-400">
                  {formatPrice(Number(price))}
                </span>
                <span className="text-2xl font-bold text-red-600">
                  {formatPrice(salePrice)}
                </span>
              </>
            ) : (
              <span className="text-2xl font-medium">
                {formatPrice(Number(price))}
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}