'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import { CheckCircle } from 'lucide-react';

export default function PaymentSuccess() {
  const [orderNumber, setOrderNumber] = useState('#ZARA-••••••••');

  useEffect(() => {
    // Generate order number ONLY on the client (fixes hydration)
    const randomNum = Math.floor(10000000 + Math.random() * 90000000);
    setOrderNumber(`#ZARA-${randomNum}`);
  }, []);
  useEffect(() => {
    localStorage.removeItem('reviewOrder');
  }, []);
  return (
    <>
      <Header />
      <div className="min-h-screen bg-gray-50 flex items-center justify-center py-20">
        <div className="text-center max-w-lg mx-auto px-6">
          <div className="mx-auto w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mb-8">
            <CheckCircle className="w-16 h-16 text-green-600" />
          </div>

          <h1 className="text-5xl font-light tracking-widest mb-4">Thank You!</h1>
          <p className="text-2xl text-gray-600 mb-8">Your order has been placed successfully</p>

          <div className="bg-white border border-gray-200 rounded-2xl p-8 mb-10 text-left">
            <p className="text-sm text-gray-500 mb-2">Order number</p>
            <p className="font-mono text-xl">{orderNumber}</p>
            
            <div className="my-6 border-t border-dashed"></div>
            
            <p className="text-sm text-gray-500">You will receive a confirmation email shortly.</p>
            <p className="text-xs text-gray-400 mt-6">Payment completed successfully</p>
          </div>

          <div className="flex flex-col gap-4">
            <Link
              href="/"
              className="inline-flex items-center justify-center gap-3 bg-black text-white py-4 px-10 rounded-full text-sm tracking-widest hover:bg-gray-800 transition"
            >
              CONTINUE SHOPPING
            </Link>
            
            <Link
              href="/"
              className="inline-flex items-center justify-center gap-3 border border-gray-300 py-4 px-10 rounded-full text-sm tracking-widest hover:bg-gray-50 transition"
            >
              BACK TO HOME
            </Link>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}