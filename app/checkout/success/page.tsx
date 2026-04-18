'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import Link from 'next/link';
import { supabaseClient } from '../../../lib/supabaseClient';

export default function CheckoutSuccess() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const orderIdFromUrl = searchParams.get('order_id');

  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const confirmOrder = async () => {
      let orderId = orderIdFromUrl;

      // If no order_id in URL (COD case), get the latest order for the user
      if (!orderId) {
        const { data: { user } } = await supabaseClient.auth.getUser();
        if (user?.email) {
          const { data } = await supabaseClient
            .from('orders')
            .select('id')
            .eq('user_email', user.email)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

          if (data) orderId = data.id;
        }
      }

      if (!orderId) {
        setStatus('error');
        setMessage('No order ID found');
        return;
      }

      try {
        const { error } = await supabaseClient
          .from('orders')
          .update({ status: 'succeeded' })
          .eq('id', orderId);

        if (error) {
          console.error('Update error:', error);
          setStatus('error');
          setMessage('Failed to confirm order');
          return;
        }

        setStatus('success');
        localStorage.removeItem('reviewOrder');
        localStorage.removeItem('pendingOrderId');

      } catch (err) {
        console.error(err);
        setStatus('error');
        setMessage('Something went wrong');
      }
    };

    confirmOrder();
  }, [orderIdFromUrl]);

  if (status === 'loading') {
    return (
      <>
        <Header />
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin w-16 h-16 border-4 border-black border-t-transparent rounded-full mx-auto mb-6"></div>
            <p>Confirming your order...</p>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12">
        <div className="text-center max-w-md mx-auto px-6">
          {status === 'success' ? (
            <>
              <h1 className="text-6xl mb-6">🎉</h1>
              <h2 className="text-4xl font-light">Thank You!</h2>
              <p className="text-xl text-gray-600 mt-4">Your order has been placed successfully.</p>
              <p className="text-xl text-gray-600 mt-4">Confirmation email has been sent.</p>

              <div className="mt-10 space-x-4">
                <Link href="/account" className="inline-block bg-black text-white px-10 py-4 rounded-full hover:bg-gray-800">
                  View My Orders
                </Link>
                <Link href="/" className="inline-block text-gray-600 hover:text-black">
                  Return to Shop
                </Link>
              </div>
            </>
          ) : (
            <>
              <h1 className="text-6xl mb-6">⚠️</h1>
              <h2 className="text-4xl font-light text-red-600">Something went wrong</h2>
              <p className="text-xl text-gray-600 mt-4">{message}</p>
              <Link href="/account" className="mt-8 inline-block bg-black text-white px-10 py-4 rounded-full hover:bg-gray-800">
                Go to My Account
              </Link>
            </>
          )}
        </div>
      </div>
    </>
  );
}