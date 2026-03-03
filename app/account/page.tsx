'use client';

import { useEffect, useState } from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { supabaseClient } from '../../lib/supabaseClient';

export default function Account() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError('');

      const { data, error: fetchError } = await supabaseClient
        .from('orders')
        .select(`
          *,
          order_items (
            product_name,
            size,
            color,
            quantity,
            price,
            image_url
          )
        `)
        .order('created_at', { ascending: false });

      if (fetchError) {
        console.error('Fetch error:', fetchError);
        setError('Failed to load orders');
        setOrders([]);
        return;
      }

      setOrders(data || []);
    } catch (err: any) {
      console.error('Fetch orders error:', err);
      setError('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-6xl mx-auto px-6">
          <h1 className="text-4xl font-light tracking-widest mb-10">My Account</h1>

          <h2 className="text-2xl font-medium mb-6">My Orders</h2>

          {loading && <p className="text-center py-20">Loading your orders...</p>}

          {error && <p className="text-red-600 text-center py-8">{error}</p>}

          {!loading && orders.length === 0 && !error && (
            <p className="text-center text-xl py-20 text-gray-500">You have no orders yet.</p>
          )}

          {orders.map((order) => (
            <div key={order.id} className="bg-white rounded-3xl p-8 mb-8 border">
              <div className="flex justify-between mb-6">
                <div>
                  <p className="text-sm text-gray-500">Order #{order.id.slice(0,8)}...</p>
                  <p className="text-sm text-gray-500">
                    {new Date(order.created_at).toLocaleString()}
                  </p>
                </div>
                <span className={`px-5 py-2 rounded-full text-sm ${order.payment_method === 'cod' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                  {order.payment_method === 'cod' ? 'Cash on Delivery' : 'Credit / Debit Card'}
                </span>
              </div>

              <div className="mb-8 bg-gray-50 p-6 rounded-2xl">
                <p className="font-medium mb-2">📍 Shipping Address</p>
                <p>{order.street}, {order.apartment}</p>
                <p>{order.city}, {order.governorate}</p>
              </div>

              <p className="font-medium mb-4">Ordered Items:</p>
              {order.order_items?.map((item: any, i: number) => (
                <div key={i} className="flex gap-6 py-6 border-b last:border-b-0">
                  {/* Product Image */}
                  {item.image_url && (
                    <img 
                      src={item.image_url} 
                      alt={item.product_name} 
                      className="w-24 h-24 object-cover rounded-2xl shrink-0" 
                    />
                  )}

                  <div className="flex-1">
                    <p className="font-medium">{item.product_name}</p>
                    <p className="text-sm text-gray-500">
                      Size: {item.size} • Color: {item.color} • Qty: {item.quantity}
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="font-medium">EGP {item.price}</p>
                  </div>
                </div>
              ))}

              <div className="mt-10 flex justify-between text-2xl font-medium border-t pt-8">
                <span>Total</span>
                <span>EGP {order.total}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
      <Footer />
    </>
  );
}