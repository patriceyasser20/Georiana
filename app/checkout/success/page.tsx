'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import Link from 'next/link';
import { supabaseClient } from '../../../lib/supabaseClient';

function CheckoutSuccessContent() {
  const searchParams = useSearchParams();
  // const orderIdFromUrl = searchParams.get('order_id');
  const rawMerchantOrderId = searchParams.get('merchant_order_id');
  const orderIdFromUrl = searchParams.get('order_id') || rawMerchantOrderId?.replace(/-\d+$/, '');
  const paymobSuccess = searchParams.get('success');
  const router = useRouter();

  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');
  const [lastOrderId, setLastOrderId] = useState<string | null>(null);

  useEffect(() => {
    const confirmOrder = async () => {
      // let finalOrderId = orderIdFromUrl;
      let finalOrderId: string | null = orderIdFromUrl ?? null;

      if (!finalOrderId) {
        finalOrderId = localStorage.getItem('last_created_order_id');
      }

      if (!finalOrderId) {
        setStatus('error');
        setMessage('No order ID found');
        return;
      }

      setLastOrderId(finalOrderId);

      // try {
      //   const { error: updateError } = await supabaseClient
      //     .from('orders')
      //     .update({ status: 'succeeded' })
      //     .eq('id', finalOrderId);


      // If Paymob explicitly says this attempt failed, don't mark the
      // order succeeded just because the page loaded — show the error
      // state instead. The webhook above is still the source of truth for
      // actual status; this only prevents a false "success" screen.
      if (paymobSuccess === 'false') {
        setStatus('error');
        setMessage('Payment was not completed. Please try again.');
        return;
      }

      try {
        const { error: updateError } = await supabaseClient
          .from('orders')
          .update({ status: 'succeeded' })
          .eq('id', finalOrderId);

        if (updateError) throw updateError;

        // Send email in background (non-blocking)
        supabaseClient.functions.invoke('bright-responder', {
          body: { order_id: finalOrderId }
        }).catch(err => {
          console.error('Email sending failed:', err);
        });

        setStatus('success');

        localStorage.removeItem('reviewOrder');
        localStorage.removeItem('pendingOrderId');
        localStorage.removeItem('last_created_order_id');

      } catch (err) {
        console.error(err);
        setStatus('error');
        setMessage('Failed to confirm your order');
      }
    };

    confirmOrder();
  }, [orderIdFromUrl]);

  const handleViewOrders = () => {
    if (lastOrderId) {
      router.push(`/account?order_id=${lastOrderId}`);
    } else {
      router.push('/account');
    }
  };

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
              <p className="text-xl text-gray-600 mt-4">A confirmation email has been sent to your inbox.</p>

              <div className="mt-12 space-x-4">
                <button
                  onClick={handleViewOrders}
                  className="inline-block bg-black text-white px-10 py-4 rounded-full hover:bg-gray-800"
                >
                  View My Order
                </button>
                <Link
                  href="/"
                  className="inline-block text-gray-600 hover:text-black"
                >
                  Return to Shop
                </Link>
              </div>
            </>
          ) : (
            <>
              <h1 className="text-6xl mb-6">⚠️</h1>
              <h2 className="text-4xl font-light text-red-600">Something went wrong</h2>
              <p className="text-xl text-gray-600 mt-4">{message}</p>
              <Link
                href="/account"
                className="mt-8 inline-block bg-black text-white px-10 py-4 rounded-full hover:bg-gray-800"
              >
                Go to My Account
              </Link>
            </>
          )}
        </div>
      </div>
    </>
  );
}

export default function CheckoutSuccess() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin w-16 h-16 border-4 border-black border-t-transparent rounded-full"></div>
      </div>
    }>
      <CheckoutSuccessContent />
    </Suspense>
  );
}