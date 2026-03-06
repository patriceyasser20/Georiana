import Header from '../../components/Header';
import Footer from '../../components/Footer';
import Link from 'next/link';

export default function Success() {
  return (
    <>
      <Header />
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-6xl mb-6">🎉</h1>
          <h2 className="text-4xl font-light">Thank You!</h2>
          <p className="text-xl text-gray-600 mt-4">Your order has been placed successfully.</p>
          <Link href="/" className="mt-8 inline-block bg-black text-white px-12 py-4 rounded-full">
            Return to Shop
          </Link>
        </div>
      </div>
      <Footer />
    </>
  );
}