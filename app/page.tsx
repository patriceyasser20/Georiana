'use client';

import { useEffect, useState } from 'react';
import Header from './components/Header';
import Footer from './components/Footer';
import ProductCard from './components/ProductCard';
import { supabaseClient as supabase } from '../lib/supabaseClient';

export default function Home() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .limit(8);

      if (error) {
        console.error('Error fetching products:', error);
      } else {
        setProducts(data || []);
      }
      setLoading(false);
    };

    fetchProducts();
  }, []);

  return (
    <>
      <Header />

      {/* Hero */}
      <section className="hero relative h-screen">
        <img 
          src="/images/hero-fashion.jpg" 
          alt="Spring 2026" 
          className="absolute inset-0 w-full h-full object-cover" 
        />
        <div className="absolute inset-0 flex flex-col items-center justify-center text-white text-center">
          <h1 className="text-7xl md:text-8xl font-light tracking-[6px]">SPRING 2026</h1>
          <p className="text-3xl mt-6 tracking-widest">Discover the new collection</p>
          <a href="#shop" className="mt-10 inline-block bg-white text-black px-12 py-4 text-sm tracking-widest hover:bg-black hover:text-white transition">
            SHOP NOW
          </a>
        </div>
      </section>

      {/* Products from database */}
      <section id="shop" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-center text-5xl font-light tracking-widest mb-16">New This Week</h2>
          
          {loading ? (
            <p className="text-center text-xl">Loading products...</p>
          ) : products.length === 0 ? (
            <p className="text-center text-xl">No products found.</p>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
              {products.map((product) => (
                <ProductCard
                  key={product.id}
                  id={product.id}
                  name={product.name}
                  price={`EGP ${product.price}`}
                  img={product.image_url}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      <Footer />
    </>
  );
}