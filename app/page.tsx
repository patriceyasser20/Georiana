'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Header from './components/Header';
import Footer from './components/Footer';
import ProductCard from './components/ProductCard';
import { supabaseClient } from '../lib/supabaseClient';
import { useTranslation } from './context/LanguageContext';

export default function Home() {
  const { t } = useTranslation();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNewProducts = async () => {
      const { data } = await supabaseClient
        .from('products')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(8);
      setProducts(data || []);
      setLoading(false);
    };
    fetchNewProducts();
  }, []);

  return (
    <>
      <Header />
      {/* ==================== YOUR ORIGINAL HERO (unchanged) ==================== */}
      <section className="relative h-[90vh] bg-[#f8f4f0] flex items-center overflow-hidden">
        {/* Left Floral Decoration */}
        <div className="absolute left-0 top-0 h-full w-40 bg-[radial-gradient(circle,#f5e8d3_1px,transparent_1px)] bg-[length:12px_12px] opacity-30"></div>
        
        {/* Right Floral Decoration */}
        <div className="absolute right-0 top-0 h-full w-40 bg-[radial-gradient(circle,#f5e8d3_1px,transparent_1px)] bg-[length:12px_12px] opacity-30"></div>

        <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-2 gap-12 items-center relative z-10">
          <div className="space-y-8">
            <h1 className="text-[5.5rem] leading-none font-light tracking-widest text-[#3a2f2f]">
              SPRING 2026
            </h1>
            <p className="text-2xl text-gray-600 max-w-md">
              Discover the new collection — designed for the modern woman.
            </p>
            <a href="/shop" className="inline-block bg-[#d4b8a8] text-white px-12 py-4 rounded-full text-sm tracking-widest hover:bg-[#c9a38f] transition">
              Shop Now
            </a>
          </div>

          <div className="relative">
            <img 
              src="https://www.thefashionlaw.com/wp-content/uploads/2017/04/Steven-Meisel-ZARA-Spring-2017-1024x579.jpg" 
              alt="Spring 2026 Woman" 
              className="rounded-3xl shadow-2xl" 
            />
          </div>
        </div>
      </section>

            {/* ==================== ZIGZAG MODEL GALLERY WITH TEXT ==================== */}
      <section className="py-20 bg-white overflow-hidden">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">

            {/* Left Column */}
            <div className="space-y-20">
              <div className="absolute  left-12 text-6xl text-[#f5e8d3] opacity-20 pointer-events-none">🌸</div>
              <motion.div
                initial={{ opacity: 0, x: -60 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: false }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="flex justify-end gap-12 items-center"   // ← Increased gap + better alignment
              >
                <img 
                  src="https://ilzijypghlyourydqhvt.supabase.co/storage/v1/object/public/product-images/ModelMesh3rafLabsaEh.jpeg" 
                  alt="Model 1"
                  className="w-96 rounded-3xl shadow-xl flex-shrink-0"   // ← Fixed width
                />
                <div className="max-w-[220px]">   {/* ← Controls text width and pushes it right */}
                  <h3 className="text-3xl font-light">Shoflna ba2a kalam yat2al</h3>
                  <p className="text-gray-600 mt-3 text-lg leading-tight">
                    Effortless style meets everyday comfort
                  </p>
                </div>
              </motion.div>
              <div className="absolute  right-12 text-6xl text-[#f5e8d3] opacity-20 pointer-events-none">🌼</div>

              {/* Second image on left (you can add more if needed) */}
              <motion.div
                initial={{ opacity: 0, x: -60 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: false }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="flex justify-end gap-12 items-center"
              >
                <img 
                  src="https://ilzijypghlyourydqhvt.supabase.co/storage/v1/object/public/product-images/ElMafrodVest.png" 
                  alt="Model 2"
                  className="w-96 rounded-3xl shadow-xl flex-shrink-0"
                />
                <div className="max-w-[220px]">
                  <h3 className="text-3xl font-light">a2ol 7aga</h3>
                  <p className="text-gray-600 mt-3 text-lg leading-tight">
                    Light, breathable, and effortlessly elegant
                  </p>
                </div>
              </motion.div>
            </div>

            {/* Right Column - shifted down a little */}
            <div className="space-y-20 lg:mt-90">
              <motion.div
                initial={{ opacity: 0, x: 60 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: false }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="flex justify-start gap-12 items-center"
              >
                <div className="max-w-[220px] text-left">   {/* ← Text on right side */}
                  <h3 className="text-3xl font-light">3shan ana mesh 3raf </h3>
                  <p className="text-gray-600 mt-3 text-lg leading-tight">
                    Luxurious fabrics for the modern woman
                  </p>
                </div>
                <img 
                  src="https://ilzijypghlyourydqhvt.supabase.co/storage/v1/object/public/product-images/modelWhiteDress.jpeg" 
                  alt="Model 3"
                  className="w-96 rounded-3xl shadow-xl flex-shrink-0"
                />
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 60 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: false }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="flex justify-start gap-12 items-center"
              >
                <div className="max-w-[220px] text-right">
                  <h3 className="text-3xl font-light">5alas</h3>
                  <p className="text-gray-600 mt-3 text-lg leading-tight">
                    Fresh looks inspired by MARIANA
                  </p>
                </div>
                <img 
                  src="https://ilzijypghlyourydqhvt.supabase.co/storage/v1/object/public/product-images/NafsEl7agaBasLonMo5tlaf.jpeg" 
                  alt="Model 4"
                  className="w-96 rounded-3xl shadow-xl flex-shrink-0"
                />
              </motion.div>
            </div>

          </div>
        </div>
      </section>

      

      {/* ==================== NEW THIS WEEK WITH FLORAL CORNERS ==================== */}
      <section className="py-24 bg-white relative">
        {/* Floral corner decorations */}
        <div className="absolute top-12 left-12 text-6xl text-[#f5e8d3] opacity-20 pointer-events-none">🌼</div>
        

        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-center text-4xl font-light tracking-widest mb-16 text-[#3a2f2f]">
            New This Week
          </h2>

          {loading ? (
            <p className="text-center py-20">Loading...</p>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {products.slice(0, 4).map((p) => (
                <ProductCard
                  key={p.id}
                  id={p.id}
                  name={p.name}
                  price={p.price}
                  img={p.images?.[0] || ''}
                  isOnSale={p.is_on_sale}
                  discountPercentage={p.discount_percentage}
                />
              ))}
            </div>
          )}
          <div className="absolute  right-12 text-6xl text-[#f5e8d3] opacity-20 pointer-events-none">🌸</div>
        </div>
      </section>

      {/* ==================== ABOUT - Feminine with Floral Accents ==================== */}
      <section className="py-24 bg-[#f8f4f0] relative overflow-hidden">
        <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
          <h2 className="text-4xl font-light tracking-widest mb-6">About GEORIANA</h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
            GEORIANA is a global fashion brand that brings the latest trends to life 
            with exceptional quality and timeless feminine elegance.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mt-16">
            <div className="relative">
              <div className="text-6xl mb-4">🌸</div>
              <h3 className="text-xl font-medium">Timeless Style</h3>
              <p className="text-gray-600 mt-3">Modern silhouettes with classic feminine appeal</p>
            </div>
            <div className="relative">
              <div className="text-6xl mb-4">🌿</div>
              <h3 className="text-xl font-medium">Sustainable Future</h3>
              <p className="text-gray-600 mt-3">Committed to responsible and ethical fashion</p>
            </div>
          </div>
        </div>

        {/* Subtle side flowers */}
        <div className="absolute bottom-0 left-12 text-[220px] text-[#f5e8d3] opacity-10 pointer-events-none">🌺</div>
        <div className="absolute top-12 right-12 text-[180px] text-[#f5e8d3] opacity-10 pointer-events-none">🌼</div>
      </section>
    </>
  );
}