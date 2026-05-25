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

      {/* ==================== HERO ==================== */}
      <section className="relative min-h-[100svh] md:h-[90vh] bg-[#f8f4f0] flex items-center overflow-hidden pt-20 md:pt-0">
        {/* Floral side decorations — hidden on mobile */}
        <div className="hidden md:block absolute left-0 top-0 h-full w-40 bg-[radial-gradient(circle,#f5e8d3_1px,transparent_1px)] bg-[length:12px_12px] opacity-30" />
        <div className="hidden md:block absolute right-0 top-0 h-full w-40 bg-[radial-gradient(circle,#f5e8d3_1px,transparent_1px)] bg-[length:12px_12px] opacity-30" />

        <div className="max-w-7xl mx-auto px-5 md:px-6 w-full relative z-10">
          {/* Mobile: stacked, image first */}
          <div className="flex flex-col-reverse md:grid md:grid-cols-2 md:gap-12 items-center gap-8">

            {/* Text */}
            <div className="space-y-5 md:space-y-8 text-center md:text-left pb-8 md:pb-0">
              <h1 className="text-5xl sm:text-6xl md:text-[5.5rem] leading-none font-light tracking-widest text-[#3a2f2f]">
                SPRING<br />2026
              </h1>
              <p className="text-base sm:text-lg md:text-2xl text-gray-600 max-w-md mx-auto md:mx-0">
                Discover the new collection — designed for the modern woman.
              </p>
              <a
                href="/shop"
                className="inline-block bg-[#d4b8a8] text-white px-10 py-4 rounded-full text-sm tracking-widest hover:bg-[#c9a38f] transition"
              >
                Shop Now
              </a>
            </div>

            {/* Image */}
            <div className="relative w-full">
              <img
                src="https://www.thefashionlaw.com/wp-content/uploads/2017/04/Steven-Meisel-ZARA-Spring-2017-1024x579.jpg"
                alt="Spring 2026 Woman"
                className="rounded-2xl md:rounded-3xl shadow-2xl w-full object-cover max-h-[55vw] md:max-h-none"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ==================== ZIGZAG MODEL GALLERY ==================== */}
      <section className="py-14 md:py-20 bg-white overflow-hidden">
        <div className="max-w-7xl mx-auto px-5 md:px-6">

          {/* ── Mobile: simple vertical stack ── */}
          <div className="flex flex-col gap-10 md:hidden">
            {[
              {
                img: 'https://ilzijypghlyourydqhvt.supabase.co/storage/v1/object/public/product-images/ModelMesh3rafLabsaEh.jpeg',
                title: 'Shoflna ba2a kalam yat2al',
                sub: 'Effortless style meets everyday comfort',
              },
              {
                img: 'https://ilzijypghlyourydqhvt.supabase.co/storage/v1/object/public/product-images/ElMafrodVest.png',
                title: 'a2ol 7aga',
                sub: 'Light, breathable, and effortlessly elegant',
              },
              {
                img: 'https://ilzijypghlyourydqhvt.supabase.co/storage/v1/object/public/product-images/modelWhiteDress.jpeg',
                title: '3shan ana mesh 3raf',
                sub: 'Luxurious fabrics for the modern woman',
              },
              {
                img: 'https://ilzijypghlyourydqhvt.supabase.co/storage/v1/object/public/product-images/NafsEl7agaBasLonMo5tlaf.jpeg',
                title: '5alas',
                sub: 'Fresh looks inspired by MARIANA',
              },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: false }}
                transition={{ duration: 0.5, delay: 0.1 * i }}
                className="flex flex-row items-center gap-5"
              >
                <img
                  src={item.img}
                  alt={item.title}
                  className="w-40 h-48 object-cover rounded-2xl shadow-lg flex-shrink-0"
                />
                <div>
                  <h3 className="text-xl font-light leading-snug">{item.title}</h3>
                  <p className="text-gray-500 mt-2 text-sm leading-snug">{item.sub}</p>
                </div>
              </motion.div>
            ))}
          </div>

          {/* ── Desktop: original zigzag layout ── */}
          <div className="hidden md:grid grid-cols-2 gap-16 items-center">

            {/* Left Column */}
            <div className="space-y-20">
              <motion.div
                initial={{ opacity: 0, x: -60 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: false }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="flex justify-end gap-12 items-center"
              >
                <img
                  src="https://ilzijypghlyourydqhvt.supabase.co/storage/v1/object/public/product-images/ModelMesh3rafLabsaEh.jpeg"
                  alt="Model 1"
                  className="w-96 rounded-3xl shadow-xl flex-shrink-0"
                />
                <div className="max-w-[220px]">
                  <h3 className="text-3xl font-light">Shoflna ba2a kalam yat2al</h3>
                  <p className="text-gray-600 mt-3 text-lg leading-tight">Effortless style meets everyday comfort</p>
                </div>
              </motion.div>

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
                  <p className="text-gray-600 mt-3 text-lg leading-tight">Light, breathable, and effortlessly elegant</p>
                </div>
              </motion.div>
            </div>

            {/* Right Column */}
            <div className="space-y-20 lg:mt-90">
              <motion.div
                initial={{ opacity: 0, x: 60 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: false }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="flex justify-start gap-12 items-center"
              >
                <div className="max-w-[220px] text-left">
                  <h3 className="text-3xl font-light">3shan ana mesh 3raf</h3>
                  <p className="text-gray-600 mt-3 text-lg leading-tight">Luxurious fabrics for the modern woman</p>
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
                  <p className="text-gray-600 mt-3 text-lg leading-tight">Fresh looks inspired by MARIANA</p>
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

      {/* ==================== NEW THIS WEEK ==================== */}
      <section className="py-14 md:py-24 bg-white relative">
        <div className="hidden md:block absolute top-12 left-12 text-6xl text-[#f5e8d3] opacity-20 pointer-events-none">🌼</div>
        <div className="hidden md:block absolute right-12 text-6xl text-[#f5e8d3] opacity-20 pointer-events-none">🌸</div>

        <div className="max-w-7xl mx-auto px-5 md:px-6">
          <h2 className="text-center text-2xl md:text-4xl font-light tracking-widest mb-8 md:mb-16 text-[#3a2f2f]">
            New This Week
          </h2>

          {loading ? (
            <p className="text-center py-20">Loading...</p>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 60 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: false }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-8"
            >
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
            </motion.div>
          )}
        </div>
      </section>

      {/* ==================== ABOUT ==================== */}
      <section className="py-14 md:py-24 bg-[#f8f4f0] relative overflow-hidden">
        <div className="max-w-4xl mx-auto px-5 md:px-6 text-center relative z-10">
          <h2 className="text-2xl md:text-4xl font-light tracking-widest mb-5 md:mb-6">
            About GEORIANA
          </h2>
          <p className="text-sm md:text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
            GEORIANA is a global fashion brand that brings the latest trends to life
            with exceptional quality and timeless feminine elegance.
          </p>

          <div className="grid grid-cols-2 md:grid-cols-2 gap-6 md:gap-12 mt-10 md:mt-16">
            <div className="relative">
              <div className="text-4xl md:text-6xl mb-3 md:mb-4">🌸</div>
              <h3 className="text-base md:text-xl font-medium">Timeless Style</h3>
              <p className="text-gray-600 mt-2 text-sm md:text-base">Modern silhouettes with classic feminine appeal</p>
            </div>
            <div className="relative">
              <div className="text-4xl md:text-6xl mb-3 md:mb-4">🌿</div>
              <h3 className="text-base md:text-xl font-medium">Sustainable Future</h3>
              <p className="text-gray-600 mt-2 text-sm md:text-base">Committed to responsible and ethical fashion</p>
            </div>
          </div>
        </div>

        {/* Subtle background flowers — smaller on mobile */}
        <div className="absolute bottom-0 left-4 md:left-12 text-[120px] md:text-[220px] text-[#f5e8d3] opacity-10 pointer-events-none">🌺</div>
        <div className="absolute top-4 md:top-12 right-4 md:right-12 text-[100px] md:text-[180px] text-[#f5e8d3] opacity-10 pointer-events-none">🌼</div>
      </section>

    </>
  );
}