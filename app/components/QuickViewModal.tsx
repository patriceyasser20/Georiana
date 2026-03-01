'use client';

import { X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useCart } from '../context/CartContext';

interface QuickViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: {
    id: number;
    name: string;
    price: string;
    img: string;
  } | null;
}

export default function QuickViewModal({ isOpen, onClose, product }: QuickViewModalProps) {
  const [quantity, setQuantity] = useState(1);
  const { addToCart } = useCart();   // ← this line is now correctly placed

  // Reset quantity when modal opens for a new product
  useEffect(() => {
    if (isOpen && product) {
      setQuantity(1);
    }
  }, [isOpen, product]);

  // Close on Escape key
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  if (!isOpen || !product) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-white max-w-4xl w-full max-h-[90vh] overflow-y-auto rounded-lg shadow-2xl relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-black z-10"
          aria-label="Close"
        >
          <X size={28} />
        </button>

        <div className="grid md:grid-cols-2 gap-8 p-8">
          {/* Left: Image */}
          <div className="flex items-center justify-center bg-gray-50 rounded-lg overflow-hidden">
            <img
              src={product.img}
              alt={product.name}
              className="max-h-500px w-auto object-contain"
            />
          </div>

          {/* Right: Details */}
          <div className="flex flex-col justify-center">
            <h2 className="text-3xl font-light tracking-wide mb-3">{product.name}</h2>
            <p className="text-2xl font-medium mb-8">{product.price}</p>

            {/* Color selector (demo) */}
            <div className="mb-6">
              <label className="block text-sm font-medium mb-2">Color</label>
              <div className="flex gap-3">
                {['Black', 'White', 'Beige', 'Navy'].map((color) => (
                  <button
                    key={color}
                    className="w-10 h-10 rounded-full border-2 border-gray-300 hover:border-black transition focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2"
                    style={{ backgroundColor: color.toLowerCase() === 'black' ? '#000' : color.toLowerCase() }}
                    title={color}
                  />
                ))}
              </div>
            </div>

            {/* Size selector (demo) */}
            <div className="mb-8">
              <label className="block text-sm font-medium mb-2">Size</label>
              <div className="flex flex-wrap gap-2">
                {['XS', 'S', 'M', 'L', 'XL'].map((size) => (
                  <button
                    key={size}
                    className="px-4 py-2 border border-gray-300 rounded-md hover:border-black hover:bg-gray-50 transition text-sm font-medium"
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>

            {/* Quantity & Add to Bag */}
            <div className="flex items-center gap-4 mb-8">
              <div className="flex border border-gray-300 rounded-md overflow-hidden">
                <button
                  type="button"
                  onClick={() => setQuantity((prev) => Math.max(1, prev - 1))}
                  className="px-4 py-2 text-lg hover:bg-gray-100 transition disabled:opacity-50"
                  disabled={quantity <= 1}
                >
                  -
                </button>

                <input
                  type="number"
                  value={quantity}
                  onChange={(e) => {
                    const val = parseInt(e.target.value);
                    if (!isNaN(val)) setQuantity(Math.max(1, val));
                  }}
                  className="w-16 text-center border-none focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />

                <button
                  type="button"
                  onClick={() => setQuantity((prev) => prev + 1)}
                  className="px-4 py-2 text-lg hover:bg-gray-100 transition"
                >
                  +
                </button>
              </div>

              {/* Updated "Add to Bag" button – connected to cart */}
              <button
                onClick={() => {
                  addToCart({
                    id: product.id,
                    name: product.name,
                    price: product.price,
                    img: product.img,
                    quantity: quantity,
                  });
                  alert(`Added ${quantity} × ${product.name} to bag!`);
                  onClose(); // optional: close modal after adding
                }}
                className="flex-1 bg-black text-white py-4 text-sm tracking-widest uppercase hover:bg-gray-800 transition"
              >
                Add to Bag
              </button>
            </div>

            <p className="text-gray-600 text-sm leading-relaxed">
              Premium quality fabric • Relaxed fit • True to size • Machine washable
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}