'use client';

import { useEffect, useState } from 'react';
import Header from '../components/Header';
import { useTranslation } from '../context/LanguageContext';
import { useSearchParams } from 'next/navigation';
import { useCurrency } from '../context/CurrencyContext';
import { supabaseClient } from '../../lib/supabaseClient';

export default function Account() {
  const { t } = useTranslation();
  const searchParams = useSearchParams();
  const orderIdParam = searchParams.get('order_id');
  const { formatPrice } = useCurrency();

  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchOrders();
  }, [orderIdParam]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError('');

      let query = supabaseClient
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

      if (orderIdParam) {
        query = query.eq('id', orderIdParam);
      } else {
        const { data: { user } } = await supabaseClient.auth.getUser();
        if (user?.email) {
          query = query.eq('user_email', user.email);
        } else {
          setOrders([]);
          setLoading(false);
          return;
        }
      }

      const { data, error: fetchError } = await query;

      if (fetchError) {
        console.error('Fetch error:', fetchError);
        setError(t('account.error'));
        setOrders([]);
        return;
      }

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
      <div className="min-h-screen bg-gray-50 py-22">
        <div className="max-w-6xl mx-auto px-6">
          <h1 className="text-4xl font-light tracking-widest mb-10">{t('account.title')}</h1>

          <h2 className="text-2xl font-medium mb-6">{t('account.myOrders')}</h2>

          {loading && <p className="text-center py-20">{t('account.loading')}</p>}

          {error && <p className="text-red-600 text-center py-8">{error}</p>}

          {!loading && orders.length === 0 && !error && (
            <p className="text-center text-xl py-20 text-gray-500">{t('account.noOrders')}</p>
          )}

          {orders.map((order) => {
            const isFreeShipping = !order.delivery_fee || Number(order.delivery_fee) === 0;
            const appliedOffers: any[] = Array.isArray(order.applied_offers) ? order.applied_offers : [];
            const offersDiscountTotal = appliedOffers.reduce((s, o) => s + Number(o.discount || 0), 0);
            const promoDiscountAmount = Math.max(0, Number(order.discount_amount || 0) - offersDiscountTotal);
            const displayTotal = Math.max(
              0,
              Number(order.total || 0) + Number(order.delivery_fee || 0) - Number(order.discount_amount || 0)
            );

            return (
              <div key={order.id} className="bg-white rounded-3xl p-8 mb-8 border">

                {/* ── Top row ── */}
                <div className="flex justify-between mb-6">
                  <div>
                    <p className="text-sm text-gray-500">
                      {t('account.orderNumber')} {order.id.slice(0, 8)}...
                    </p>
                    <p className="text-sm text-gray-500">
                      {new Date(order.created_at).toLocaleString('en-US', {
                        month: 'numeric',
                        day: 'numeric',
                        year: 'numeric',
                        hour: 'numeric',
                        minute: 'numeric',
                        hour12: true
                      })}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2 items-start justify-end">
                    {/* Payment method badge */}
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

                    {/* Free Shipping badge */}
                    {isFreeShipping && (
                      <span className="px-5 py-2 rounded-full text-sm bg-emerald-100 text-emerald-700 font-medium">
                         Free Shipping
                      </span>
                    )}
                  </div>
                </div>

                {/* ── Shipping Address ── */}
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

                {/* ── Order Items ── */}
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
                        <p className="font-medium">{formatPrice(Number(item.price))}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 py-8 text-center">No items found for this order</p>
                )}

                {/* ── Price Breakdown ── */}
                <div className="mt-6 space-y-3">

                  {/* Order subtotal */}
                  {order.total && order.total > 0 && (
                    <div className="flex justify-between text-lg">
                      <span className="text-gray-600">Order Total</span>
                      <span className="font-medium">{formatPrice(Number(order.total))}</span>
                    </div>
                  )}

                  {/* Delivery fee — free or paid */}
                  <div className="flex justify-between text-lg">
                    <span className="text-gray-600">Delivery Fee</span>
                    {isFreeShipping ? (
                      <span className="font-medium text-emerald-600">🚚 Free</span>
                    ) : (
                      <span className="font-medium">{formatPrice(Number(order.delivery_fee))}</span>
                    )}
                  </div>

                  {/* Buy X Get Y offer rows — only if this order had any applied */}
                  {appliedOffers.map((o, i) => (
                    <div key={i} className="flex justify-between text-lg">
                      <span className="text-gray-600">🏷️ {o.name}</span>
                      <span className="font-medium text-emerald-600">
                        -{formatPrice(Number(o.discount))}
                      </span>
                    </div>
                  ))}

                  {/* Promo code row — only if a promo was applied */}
                  {order.promo_code && (
                    <div className="flex justify-between text-lg">
                      <span className="text-gray-600">
                        Discount ({order.promo_code})
                      </span>
                      <span className="font-medium text-red-600">
                        -{formatPrice(promoDiscountAmount)}
                      </span>
                    </div>
                  )}

                  {/* Fallback — only when there's a discount but no promo and no itemized offers */}
                  {!order.promo_code && appliedOffers.length === 0 && Number(order.discount_amount) > 0 && (
                    <div className="flex justify-between text-lg">
                      <span className="text-gray-600">Discount</span>
                      <span className="font-medium text-red-600">
                        -{formatPrice(Number(order.discount_amount))}
                      </span>
                    </div>
                  )}
                </div>

                {/* ── Grand Total ── */}
                <div className="mt-6 flex justify-between text-2xl font-medium border-t pt-8">
                  <span>{t('account.total')}</span>
                  <span>{formatPrice(displayTotal)}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}