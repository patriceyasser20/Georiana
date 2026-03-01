'use client';

import { useEffect, useState } from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { getCart, removeFromCart, updateCartItem } from '../actions/cart';  // ← correct import (no .ts)
import { Trash2, Plus, Minus } from 'lucide-react';

export default function Cart() {
  const [cart, setCart] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCart = async () => {
      try {
        const items = await getCart();
        setCart(items);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchCart();
  }, []);

  const handleUpdateQuantity = async (productId: string, newQty: number) => {
    if (newQty < 1) return;
    await updateCartItem(productId, newQty);
    setCart(prev => prev.map(item => 
      item.product.id === productId ? { ...item, quantity: newQty } : item
    ));
  };

  const handleRemove = async (productId: string) => {
    await removeFromCart(productId);
    setCart(prev => prev.filter(item => item.product.id !== productId));
  };

  const total = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);

  if (loading) return <div>Loading cart...</div>;

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-6xl mx-auto px-6">
          <h1 className="text-4xl font-light tracking-widest mb-8">Your Cart</h1>

          {cart.length === 0 ? (
            <p className="text-center text-xl">Your cart is empty</p>
          ) : (
            <>
              {cart.map(item => (
                <div key={item.id} className="flex items-center gap-6 border-b py-6">
                  <img 
                    src={item.product.image_url} 
                    alt={item.product.name} 
                    className="w-24 h-24 object-cover rounded-md"
                  />
                  <div className="flex-1">
                    <p className="font-medium">{item.product.name}</p>
                    <p className="text-gray-600">EGP {item.product.price}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <button onClick={() => handleUpdateQuantity(item.product.id, item.quantity - 1)}>
                      <Minus size={20} />
                    </button>
                    <span>{item.quantity}</span>
                    <button onClick={() => handleUpdateQuantity(item.product.id, item.quantity + 1)}>
                      <Plus size={20} />
                    </button>
                  </div>
                  <button onClick={() => handleRemove(item.product.id)}>
                    <Trash2 size={20} className="text-red-600" />
                  </button>
                </div>
              ))}

              <div className="mt-12 text-right">
                <p className="text-2xl font-medium">Total: EGP {total}</p>
                <a href="/checkout" className="inline-block mt-6 bg-black text-white px-12 py-4 rounded-full">
                  PROCEED TO CHECKOUT
                </a>
              </div>
            </>
          )}
        </div>
      </div>
      <Footer />
    </>
  );
}