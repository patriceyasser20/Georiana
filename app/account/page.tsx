'use client';

import { useEffect, useState } from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { supabaseClient } from '../../lib/supabaseClient';
import { useTranslation } from '../context/LanguageContext';

export default function Account() {
  const { t } = useTranslation();

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
        .in('status', ['succeeded', 'confirmed'])
        .order('created_at', { ascending: false });

      if (fetchError) {
        console.error('Fetch error:', fetchError);
        setError(t('account.error'));
        setOrders([]);
        return;
      }

      console.log('📦 Orders loaded with items:', data); // for debugging
      setOrders(data || []);
    } catch (err: any) {
      console.error('Fetch orders error:', err);
      setError(t('account.error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-6xl mx-auto px-6">
          <h1 className="text-4xl font-light tracking-widest mb-10">{t('account.title')}</h1>

          <h2 className="text-2xl font-medium mb-6">{t('account.myOrders')}</h2>

          {loading && <p className="text-center py-20">{t('account.loading')}</p>}

          {error && <p className="text-red-600 text-center py-8">{error}</p>}

          {!loading && orders.length === 0 && !error && (
            <p className="text-center text-xl py-20 text-gray-500">{t('account.noOrders')}</p>
          )}

          {orders.map((order) => {
            const displayTotal = Number(order.total || 0) + Number(order.delivery_fee || 0);

            return (
              <div key={order.id} className="bg-white rounded-3xl p-8 mb-8 border">
                <div className="flex justify-between mb-6">
                  <div>
                    <p className="text-sm text-gray-500">
                      {t('account.orderNumber')} {order.id.slice(0, 8)}...
                    </p>
                    <p className="text-sm text-gray-500">
                      {new Date(order.created_at).toLocaleString()}
                    </p>
                  </div>
                  <span
                    className={`px-5 py-2 rounded-full text-sm ${
                      order.payment_method?.toLowerCase().includes('cash') || 
                      order.payment_method === 'Cash on Delivery' ||
                      order.status === 'confirmed'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-blue-100 text-blue-700'
                    }`}
                  >
                    {order.payment_method?.toLowerCase().includes('cash') || 
                     order.payment_method === 'Cash on Delivery' ||
                     order.status === 'confirmed'
                      ? t('account.cod')
                      : t('account.card')}
                  </span>
                </div>

                <div className="mb-8 bg-gray-50 p-6 rounded-2xl">
                  <p className="font-medium mb-2">{t('account.shippingAddress')}</p>
                  <p>{order.street}, {order.apartment}</p>
                  <p>{order.city}</p>
                  {order.governorate && (
                    <p className="mt-1 font-medium">
                      Governorate: <span className="text-black">{order.governorate}</span>
                    </p>
                  )}
                </div>

                <p className="font-medium mb-4">{t('account.orderedItems')}</p>

                {order.order_items && order.order_items.length > 0 ? (
                  order.order_items.map((item: any, i: number) => (
                    <div key={i} className="flex gap-6 py-6 border-b last:border-b-0">
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
                        <p className="font-medium">EGP {Number(item.price).toFixed(2)}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 py-8 text-center">No items found for this order</p>
                )}

                {/* Delivery Fee */}
                {order.delivery_fee && order.delivery_fee > 0 && (
                  <div className="flex justify-between text-lg mt-6">
                    <span className="text-gray-600">Delivery Fee</span>
                    <span className="font-medium">EGP {Number(order.delivery_fee).toFixed(2)}</span>
                  </div>
                )}
                {order.total && order.total > 0 && (
                  <div className="flex justify-between text-lg mt-6">
                    <span className="text-gray-600">Order Total</span>
                    <span className="font-medium">EGP {Number(order.total).toFixed(2)}</span>
                  </div>
                )}

                <div className="mt-10 flex justify-between text-2xl font-medium  pt-8">
                  <span>{t('account.total')}</span>
                  <span>EGP {displayTotal.toFixed(2)}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <Footer />
    </>
  );
}