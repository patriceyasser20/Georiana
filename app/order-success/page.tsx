'use client';

import Link from 'next/link';
import Image from 'next/image';
import { CheckCircle, ArrowRight } from 'lucide-react';
import { useEffect, useState } from 'react';

interface CartItem {
  id: number;
  name: string;
  price: string;
  img: string;
  quantity: number;
}

export default function OrderSuccessPage() {
  const [orderedItems, setOrderedItems] = useState<CartItem[]>([]);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    const savedCart = localStorage.getItem('lastOrderCart');

    if (savedCart) {
      try {
        const items: CartItem[] = JSON.parse(savedCart);
        setOrderedItems(items);

        // Calculate total
        const calcTotal = items.reduce((sum, item) => {
          const priceNum = parseFloat(item.price.replace(/[^\d.]/g, ''));
          return sum + priceNum * item.quantity;
        }, 0);
        setTotal(calcTotal);

        // Clean up
        localStorage.removeItem('lastOrderCart');
      } catch (err) {
        console.error('Error parsing last order cart:', err);
      }
    }
  }, []);

  // Fake order number & delivery
  const orderNumber = Math.floor(100000 + Math.random() * 900000);
  const deliveryDate = new Date();
  deliveryDate.setDate(deliveryDate.getDate() + 3 + Math.floor(Math.random() * 4));

  const formatDate = (date: Date) =>
    date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  const formatPrice = (num: number) =>
    `EGP ${num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  // Subtotal breakdown values (same logic as checkout)
  const subtotal = orderedItems.reduce((sum, item) => {
    const priceNum = parseFloat(item.price.replace(/[^\d.]/g, ''));
    return sum + priceNum * item.quantity;
  }, 0);

  const shipping = subtotal > 2000 ? 0 : 150;
  const tax = subtotal * 0.14;
  const grandTotal = subtotal + shipping + tax;

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-6 py-16">
      <div className="max-w-3xl w-full text-center">
        {/* Success Icon */}
        <div className="mb-10">
          <CheckCircle className="mx-auto text-green-600" size={100} strokeWidth={1.5} />
        </div>

        {/* Thank You Message */}
        <h1 className="text-5xl md:text-6xl font-light tracking-wider mb-6">Thank You</h1>
        <p className="text-xl md:text-2xl text-gray-700 mb-4">
          Your order has been successfully placed!
        </p>
        <p className="text-lg text-gray-600 mb-10 max-w-lg mx-auto">
          We're preparing your items with care. You'll receive a confirmation email shortly.
        </p>

        {/* Order Details Card */}
        <div className="bg-white rounded-xl shadow-sm p-8 mb-12 border border-gray-100 text-left">
          <div className="grid md:grid-cols-2 gap-8 mb-10">
            <div>
              <p className="text-sm text-gray-500 uppercase tracking-wider mb-1">Order Number</p>
              <p className="text-2xl font-medium">#{orderNumber}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 uppercase tracking-wider mb-1">Estimated Delivery</p>
              <p className="text-xl font-medium">{formatDate(deliveryDate)}</p>
            </div>
          </div>

          {/* Ordered Items */}
          {orderedItems.length > 0 ? (
            <div className="space-y-8">
              <h3 className="text-xl font-medium mb-4">Your Items</h3>

              {orderedItems.map((item) => (
                <div
                  key={item.id}
                  className="flex gap-6 pb-6 border-b border-gray-100 last:border-b-0 last:pb-0"
                >
                  <div className="relative w-24 h-32 bg-gray-50 rounded-md overflow-hidden shrink-0">
                    <Image
                      src={item.img}
                      alt={item.name}
                      fill
                      className="object-cover"
                      sizes="96px"
                    />
                  </div>

                  <div className="flex-1">
                    <p className="font-medium text-lg">{item.name}</p>
                    <p className="text-sm text-gray-600 mt-1">Qty: {item.quantity}</p>
                    <p className="mt-2 font-medium text-base">
                      {formatPrice(parseFloat(item.price.replace(/[^\d.]/g, '')) * item.quantity)}
                    </p>
                  </div>
                </div>
              ))}

              {/* Subtotal Breakdown – ADDED HERE */}
              <div className="pt-6 border-t border-gray-200 space-y-3 text-gray-700">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>{formatPrice(subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Shipping</span>
                  <span>{shipping === 0 ? 'Free' : formatPrice(shipping)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Estimated Tax</span>
                  <span>{formatPrice(tax)}</span>
                </div>
                <div className="flex justify-between pt-4 text-xl font-medium border-t border-gray-200">
                  <span>Total</span>
                  <span className="text-2xl">{formatPrice(grandTotal)}</span>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-gray-500 italic text-center py-8">
              No items found in recent order.
            </p>
          )}
        </div>

        {/* Call to Action */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
          <Link
            href="/"
            className="inline-flex items-center gap-2 bg-black text-white px-10 py-4 text-base font-medium tracking-wider uppercase hover:bg-gray-900 transition rounded-lg"
          >
            Continue Shopping <ArrowRight size={18} />
          </Link>

          <Link href="/" className="text-gray-600 hover:text-black transition text-base font-medium">
            Return to Homepage
          </Link>
        </div>
      </div>
    </div>
  );
}