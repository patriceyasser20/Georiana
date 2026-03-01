'use client';

import { useState } from 'react';
import { ShoppingCart, X } from 'lucide-react';
import { addToCart } from '../actions/cart';

interface ProductCardProps {
  id: string;
  name: string;
  price: string;
  img: string;
  // You can add description, sizes, colors later
  description?: string;
}

export default function ProductCard({ id, name, price, img, description = "Premium quality fashion item" }: ProductCardProps) {
  const [isQuickViewOpen, setIsQuickViewOpen] = useState(false);

  const handleAddToCart = async () => {
    try {
      await addToCart(id, 1);
      alert('Added to cart!');
    } catch (err) {
      alert('Error adding to cart');
    }
  };

  return (
    <>
      {/* Product Card */}
      <div className="product-card group cursor-pointer">
        <div className="relative overflow-hidden">
          <img
            src={img}
            alt={name}
            className="w-full aspect-3/4 object-cover transition-transform duration-500 group-hover:scale-105"
          />
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

          <button
            onClick={handleAddToCart}
            className="mt-4 bg-black text-white px-6 py-2 text-xs rounded-full hover:bg-gray-800 transition"
          >
            <ShoppingCart size={16} className="inline mr-2" />
            ADD TO CART
          </button>
        </div>
      </div>

      {/* Quick View Modal */}
      {isQuickViewOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl max-w-4xl w-full m-4 max-h-[90vh] overflow-y-auto relative">
            {/* Close button */}
            <button
              onClick={() => setIsQuickViewOpen(false)}
              className="absolute top-4 right-4 text-gray-600 hover:text-black z-10"
            >
              <X size={28} />
            </button>

            <div className="grid md:grid-cols-2 gap-8 p-8">
              {/* Image */}
              <div>
                <img
                  src={img}
                  alt={name}
                  className="w-full h-auto object-cover rounded-xl"
                />
              </div>

              {/* Details */}
              <div className="flex flex-col justify-center">
                <h2 className="text-3xl font-light tracking-wide mb-4">{name}</h2>
                <p className="text-2xl font-medium text-gray-800 mb-6">{price}</p>
                <p className="text-gray-600 mb-8">{description}</p>

                {/* Add to cart button in modal */}
                <button
                  onClick={handleAddToCart}
                  className="bg-black text-white py-4 px-10 rounded-full text-sm tracking-widest hover:bg-gray-800 transition w-full md:w-auto"
                >
                  <ShoppingCart size={18} className="inline mr-3" />
                  ADD TO CART
                </button>

                {/* Optional: size/color selector later */}
                <div className="mt-8 text-sm text-gray-500">
                  Free shipping on orders over EGP 1000 • Returns within 14 days
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}