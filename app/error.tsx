'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Unhandled error:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-6">
      <div className="text-center max-w-md">
        <h1 className="text-6xl mb-6">⚠️</h1>
        <h2 className="text-3xl font-light tracking-widest mb-4">Something went wrong</h2>
        <p className="text-gray-500 mb-10">
          We hit an unexpected error. Please try again, or head back to the homepage.
        </p>
        <div className="flex items-center justify-center gap-4">
          <button
            onClick={() => reset()}
            className="bg-black text-white px-8 py-4 rounded-full text-sm tracking-widest hover:bg-gray-800 transition"
          >
            Try Again
          </button>
          <Link
            href="/"
            className="text-gray-600 hover:text-black transition text-sm"
          >
            Return Home
          </Link>
        </div>
      </div>
    </div>
  );
}