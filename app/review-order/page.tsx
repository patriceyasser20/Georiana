'use client';

import { useEffect, useState } from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { Trash2, Plus, Minus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabaseClient } from '../../lib/supabaseClient';

export default function ReviewOrder() {
  const router = useRouter();
  const [items, setItems] = useState<any[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem('reviewOrder');
    if (saved) setItems(JSON.parse(saved));
  }, []);

  const updateQuantity = (index: number, newQty: number) => {
    if (newQty < 1) return;
    const newItems = [...items];
    newItems[index].quantity = newQty;
    setItems(newItems);
    localStorage.setItem('reviewOrder', JSON.stringify(newItems));
  };

  const removeItem = (index: number) => {
    const newItems = items.filter((_, i) => i !== index);
    setItems(newItems);
    localStorage.setItem('reviewOrder', JSON.stringify(newItems));
  };

  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const proceedToCheckout = async () => {
    if (items.length === 0) return;

    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) {
      alert("Please sign in to complete the order");
      return;
    }

    try {
      // 1. Create main order - using EXACT column names from your database
      const { data: order, error: orderError } = await supabaseClient
        .from('orders')
        .insert({
          user_email: user.email,           // ← Changed from user_id
          total: total,                     // ← Changed from total_amount
          payment_method: 'pending',        // Will be updated in checkout
          street: 'Test Street',            // You can connect real form later
          apartment: '1',
          city: 'Cairo',
          governorate: 'Cairo',
          status: 'pending'
        })
        .select()
        .single();

      if (orderError) throw new Error(orderError.message);

      // 2. Save order items
      const orderItems = items.map(item => ({
        order_id: order.id,
        product_name: item.name,
        size: item.size,
        color: item.color,
        quantity: item.quantity,
        price: item.price,
        image_url: item.image_url
      }));

      const { error: itemsError } = await supabaseClient
        .from('order_items')
        .insert(orderItems);

      if (itemsError) throw new Error(itemsError.message);

      console.log('✅ Order saved successfully! ID:', order.id);

      // Do NOT clear localStorage here (checkout needs the data)
      alert("✅ Order saved! Going to checkout...");
      router.push('/checkout');

    } catch (error: any) {
      console.error("Full order error:", error);
      alert("Error saving order: " + (error.message || "Unknown error"));
    }
  };

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-6xl mx-auto px-6">
          
          <Link href="/" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-black mb-6">
            ← Continue Shopping
          </Link>

          <h1 className="text-4xl font-light tracking-widest mb-8">Review Your Order</h1>

          {items.length === 0 ? (
            <p className="text-center text-xl py-20">Your order is empty</p>
          ) : (
            <>
              {items.map((item, index) => (
                <div key={index} className="flex items-center gap-6 border-b py-8">
                  <img src={item.image_url} alt={item.name} className="w-28 h-28 object-cover rounded-xl" />
                  <div className="flex-1">
                    <p className="font-medium text-lg">{item.name}</p>
                    <p className="text-sm text-gray-500">Size: {item.size} • Color: {item.color}</p>
                    <p className="text-gray-600 mt-1">EGP {item.price}</p>
                  </div>

                  <div className="flex items-center gap-4">
                    <button onClick={() => updateQuantity(index, item.quantity - 1)}><Minus size={20} /></button>
                    <span className="w-8 text-center font-medium">{item.quantity}</span>
                    <button onClick={() => updateQuantity(index, item.quantity + 1)}><Plus size={20} /></button>
                  </div>

                  <button onClick={() => removeItem(index)} className="text-red-600 hover:text-red-700">
                    <Trash2 size={22} />
                  </button>
                </div>
              ))}

              <div className="mt-12 border-t pt-8 text-right">
                <p className="text-3xl font-medium">Total: EGP {total}</p>
                <button
                  onClick={proceedToCheckout}
                  className="mt-8 bg-black text-white px-16 py-5 rounded-full text-sm tracking-widest hover:bg-gray-800 transition"
                >
                  PROCEED TO CHECKOUT
                </button>
              </div>
            </>
          )}
        </div>
      </div>
      <Footer />
    </>
  );
}