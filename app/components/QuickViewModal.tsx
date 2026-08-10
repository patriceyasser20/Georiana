'use client';

import { useState } from 'react';
import { X, Heart } from 'lucide-react';
import { supabaseClient } from '../../lib/supabaseClient';
import { useRouter } from 'next/navigation';
import Image from "next/image";

interface QuickViewModalProps {
  id: string;
  name: string;
  price: string;
  img: string;
  sizes?: string[];
  colors?: string[];
  isOpen: boolean;
  onClose: () => void;
}

export default function QuickViewModal({
  id,
  name,
  price,
  img,
  sizes = ['S', 'M', 'L', 'XL'],
  colors = ['Black', 'Brown', 'Navy'],
  isOpen,
  onClose
}: QuickViewModalProps) {
  const router = useRouter();
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [isWishlisted, setIsWishlisted] = useState(false);

  if (!isOpen) return null;

  const handleBuyNow = () => {
  if (!selectedSize || !selectedColor) {
    alert("Please select size and color");
    return;
  }

  const item = {
    id,
    name,
    price: parseInt(price.replace(/[^0-9]/g, '')),
    image_url: img,
    size: selectedSize,
    color: selectedColor,
    quantity: 1
  };

  let reviewOrder = JSON.parse(localStorage.getItem('reviewOrder') || '[]');

  // Check if same product + same size + same color already exists
  const existingIndex = reviewOrder.findIndex(
    (existing: any) => 
      existing.id === item.id && 
      existing.size === item.size && 
      existing.color === item.color
  );

  if (existingIndex !== -1) {
    // Increase quantity
    reviewOrder[existingIndex].quantity += 1;
  } else {
    // Add new item
    reviewOrder.push(item);
  }

  localStorage.setItem('reviewOrder', JSON.stringify(reviewOrder));

  onClose();
  router.push('/review-order');
};

  const toggleWishlist = async () => {
    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) {
      alert("Please sign in to use wishlist");
      return;
    }
    setIsWishlisted(!isWishlisted);
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl max-w-4xl w-full overflow-hidden relative">
        <button onClick={onClose} className="absolute top-6 right-6 z-10 text-gray-500 hover:text-black">
          <X size={32} />
        </button>

        <div className="grid md:grid-cols-2 gap-10 p-10">
          <div className="relative w-full h-full min-h-[400px]">
            <Image src={img} alt={name} fill sizes="(max-width: 768px) 100vw, 50vw" className="object-cover rounded-2xl" />
          </div>

          <div>
            <h2 className="text-4xl font-light tracking-wide">{name}</h2>
            <p className="text-3xl font-medium mt-2 mb-8">{price}</p>

            {/* Sizes */}
            <div className="mb-8">
              <p className="font-medium mb-3">Size</p>
              <div className="flex flex-wrap gap-3">
                {sizes.map(size => (
                  <button
                    key={size}
                    onClick={() => setSelectedSize(size)}
                    className={`px-6 py-3 border rounded-full text-sm transition ${selectedSize === size ? 'bg-black text-white border-black' : 'border-gray-300 hover:border-black'}`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>

            {/* Colors */}
            <div className="mb-10">
              <p className="font-medium mb-3">Color</p>
              <div className="flex flex-wrap gap-3">
                {colors.map(color => (
                  <button
                    key={color}
                    onClick={() => setSelectedColor(color)}
                    className={`w-10 h-10 rounded-full border-2 transition ${selectedColor === color ? 'border-black scale-110' : 'border-gray-300'}`}
                    style={{ backgroundColor: color.toLowerCase() }}
                    title={color}
                  />
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-4">
              <button onClick={handleBuyNow} className="bg-black text-white py-4 rounded-full text-sm tracking-widest hover:bg-gray-800 transition">
                BUY NOW
              </button>

              <button onClick={toggleWishlist} className="flex items-center justify-center gap-3 border border-black py-4 rounded-full text-sm tracking-widest hover:bg-black hover:text-white transition">
                <Heart size={20} fill={isWishlisted ? "red" : "none"} />
                {isWishlisted ? "REMOVE FROM WISHLIST" : "ADD TO WISHLIST"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}