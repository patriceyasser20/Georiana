'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Header from './components/Header';
import Footer from './components/Footer';
import ProductCard from './components/ProductCard';
import { supabaseClient } from '../lib/supabaseClient';
import { useTranslation } from './context/LanguageContext';
import { getCached, setCached } from '../lib/productCache';
import { type Offer, isOfferLive, offerBadgeText } from '../lib/offers';

export default function Home() {
  const { t } = useTranslation();
  const [products, setProducts] = useState<any[]>([]);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);

  const slugify = (text: string) =>
    text.toLowerCase().trim().replace(/\s+/g, '-').replace(/[^\w-]+/g, '');

  useEffect(() => {
    const fetchNewProducts = async () => {
      const { data: featuredRowsRaw } = await supabaseClient
        .from('featured_products')
        .select('product_id, position, created_at')
        .eq('section', 'new_this_week')
        .order('position');

      const dedupedByProduct = new Map<string, any>();
      for (const row of featuredRowsRaw || []) {
        const existing = dedupedByProduct.get(row.product_id);
        if (!existing || new Date(row.created_at) > new Date(existing.created_at)) {
          dedupedByProduct.set(row.product_id, row);
        }
      }
      const featuredRows = [...dedupedByProduct.values()].sort((a, b) => a.position - b.position);

      if (featuredRows.length > 0) {
        const productIds = featuredRows.map((f: any) => f.product_id);
        const { data: featuredProducts } = await supabaseClient
          .from('products')
          .select('id, name, price, images, is_on_sale, discount_percentage, category, collection')
          .in('id', productIds);

        const byId = new Map((featuredProducts || []).map((p: any) => [p.id, p]));
        const mapped = featuredRows
          .map((f: any) => byId.get(f.product_id))
          .filter(Boolean);

        if (mapped.length > 0) {
          setProducts(mapped);
          setLoading(false);
          return;
        }
      }

      const { data } = await supabaseClient
        .from('products')
        .select('id, name, price, images, is_on_sale, discount_percentage, category, collection')
        .order('created_at', { ascending: false })
        .limit(8);
      setProducts(data || []);
      setLoading(false);
    };
    fetchNewProducts();
  }, []);

  useEffect(() => {
    const fetchOffers = async () => {
      const cacheKey = 'active-offers';
      const cached = getCached(cacheKey);
      if (cached) { setOffers(cached as Offer[]); return; }

      const { data } = await supabaseClient
        .from('offers')
        .select('*')
        .eq('is_active', true);

      setCached(cacheKey, data || [], 5 * 60 * 1000);
      setOffers((data || []) as Offer[]);
    };
    fetchOffers();
  }, []);

  const [catalogProducts, setCatalogProducts] = useState<any[]>([]);
  useEffect(() => {
    const fetchCatalog = async () => {
      const cacheKey = 'all-products';
      const cached = getCached(cacheKey);
      if (cached) { setCatalogProducts(cached); return; }

      const { data } = await supabaseClient
        .from('products')
        .select(`
          id, name, price, images, is_on_sale, discount_percentage, category, collection,
          product_variants ( id, color, size, sku, is_on_sale, discount_percentage )
        `)
        .order('created_at', { ascending: false });

      setCached(cacheKey, data || []);
      setCatalogProducts(data || []);
    };
    fetchCatalog();
  }, []);

  const liveOffers = offers.filter(isOfferLive);
  const offerSlides = liveOffers
    .map((offer) => {
      let matchingProduct: any = null;
      let href = '/shop';
      let scopeDescription = '';

      if (offer.scope_type === 'all') {
        matchingProduct = catalogProducts[0] || null;
        href = '/shop';
        scopeDescription = 'Storewide';
      } else if (offer.scope_type === 'product') {
        matchingProduct = catalogProducts.find((p) => p.id === offer.scope_value) || null;
        href = matchingProduct ? `/product/${matchingProduct.id}` : '/shop';
        scopeDescription = matchingProduct?.name || '';
      } else if (offer.scope_type === 'category') {
        matchingProduct = catalogProducts.find((p) => p.category === offer.scope_value) || null;
        href = `/woman/${slugify(offer.scope_value)}`;
        scopeDescription = offer.scope_value;
      } else if (offer.scope_type === 'collection') {
        matchingProduct = catalogProducts.find((p) => p.collection === offer.scope_value) || null;
        href = `/collection/${slugify(offer.scope_value)}`;
        scopeDescription = offer.scope_value;
      }

      if (!matchingProduct) return null;

      return {
        key: `offer-${offer.id}`,
        kind: 'offer' as const,
        badgeText: offerBadgeText(offer),
        title: offer.name,
        subtitle: scopeDescription,
        href,
        image: null as string | null,
      };
    })
    .filter((s): s is NonNullable<typeof s> => s !== null);

  const productSaleSlides = catalogProducts
    .filter((p: any) => p.is_on_sale && Number(p.discount_percentage) > 0)
    .map((p: any) => ({
      key: `product-sale-${p.id}`,
      kind: 'sale' as const,
      badgeText: `-${p.discount_percentage}% OFF`,
      title: p.name,
      subtitle: 'On Sale',
      href: `/product/${p.id}`,
      image: p.images?.[0] || null,
    }));

  // ── Only include variant slides where v.id is defined ──
  const variantSaleSlides = catalogProducts.flatMap((p: any) =>
    (p.product_variants || [])
      .filter((v: any) => v.id && v.is_on_sale && Number(v.discount_percentage) > 0 && !p.is_on_sale)
      .map((v: any) => ({
        key: `variant-sale-${v.id}`,
        kind: 'sale' as const,
        badgeText: `-${v.discount_percentage}% OFF`,
        title: p.name,
        subtitle: [v.color, v.size].filter(Boolean).join(' / ') || 'Selected variant',
        href: `/product/${p.id}`,
        image: p.images?.[0] || null,
      }))
  );

  const displayableOffers = [...offerSlides, ...productSaleSlides, ...variantSaleSlides];

  const [offerSlide, setOfferSlide] = useState(0);
  const offerCount = displayableOffers.length;

  useEffect(() => {
    if (offerCount <= 1) return;
    const interval = setInterval(() => {
      setOfferSlide((prev) => (prev + 1) % offerCount);
    }, 4500);
    return () => clearInterval(interval);
  }, [offerCount]);

  useEffect(() => {
    if (offerSlide >= offerCount && offerCount > 0) setOfferSlide(0);
  }, [offerCount, offerSlide]);

  return (
    <>
      <Header />

      {/* ==================== HERO ==================== */}
      <section className="relative min-h-[100svh] md:h-[90vh] bg-[#f8f4f0] flex items-center overflow-hidden pt-20 md:pt-0">
        <div className="hidden md:block absolute left-0 top-0 h-full w-40 bg-[radial-gradient(circle,#f5e8d3_1px,transparent_1px)] bg-[length:12px_12px] opacity-30" />
        <div className="hidden md:block absolute right-0 top-0 h-full w-40 bg-[radial-gradient(circle,#f5e8d3_1px,transparent_1px)] bg-[length:12px_12px] opacity-30" />

        <div className="max-w-7xl mx-auto px-5 md:px-6 w-full relative z-10">
          <div className="flex flex-col-reverse md:grid md:grid-cols-2 md:gap-12 items-center gap-8">
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

      {/* ==================== ACTIVE OFFERS ==================== */}
      {displayableOffers.length > 0 && (
        <section className="py-14 md:py-24 bg-[#f8f4f0] relative overflow-hidden">
          <div className="hidden md:block absolute top-10 left-10 text-6xl text-[#e8c4ad] opacity-30 pointer-events-none">🌷</div>
          <div className="hidden md:block absolute bottom-10 right-10 text-6xl text-[#e8c4ad] opacity-30 pointer-events-none">🌷</div>

          <div className="max-w-6xl mx-auto px-5 md:px-6 relative z-10">
            <div className="text-center mb-10 md:mb-14">
              <span className="text-[#c9a38f] text-xs md:text-sm tracking-[0.35em] uppercase">Limited Time</span>
              <h2 className="text-2xl md:text-4xl font-light tracking-widest mt-3 text-[#3a2f2f]">Current Offers</h2>
            </div>

            {(() => {
              const count = displayableOffers.length;
              const prevIndex = (offerSlide - 1 + count) % count;
              const nextIndex = (offerSlide + 1) % count;
              const showLeftPeek = count > 2;
              const showRightPeek = count > 1;

              type Slide = typeof displayableOffers[number];

              const SlideCard = ({ slide, active }: { slide: Slide; active: boolean }) => (
                <div className={`flex shrink-0 rounded-2xl md:rounded-3xl bg-white overflow-hidden transition-all duration-500 ${
                  active
                    ? 'w-[82vw] sm:w-[480px] md:w-[560px] shadow-lg scale-100 opacity-100'
                    : 'hidden sm:flex w-[180px] md:w-[240px] shadow-sm scale-95 opacity-40 pointer-events-none'
                }`}>
                  {active && slide.image && (
                    <div className="w-44 md:w-52 shrink-0">
                      <img src={slide.image} alt={slide.title} className="w-full h-full object-cover" />
                    </div>
                  )}
                  <div className={`flex flex-col justify-center gap-3 ${active ? 'p-7 md:p-9' : 'p-4 items-center text-center'}`}>
                    <span className={`text-[#c9a38f] font-medium tracking-[0.2em] uppercase ${active ? 'text-xs' : 'text-[10px]'}`}>
                      {slide.badgeText}
                    </span>
                    <p className={`font-light tracking-wide text-[#3a2f2f] ${active ? 'text-xl md:text-2xl' : 'text-sm leading-snug'}`}>
                      {slide.title}
                    </p>
                    {active && (
                      <>
                        <p className="text-gray-500 text-sm">{slide.subtitle}</p>
                        <a href={slide.href} className="mt-1 self-start inline-block bg-[#3a2f2f] text-white text-xs tracking-widest px-7 py-3 rounded-full hover:bg-[#2a2222] transition">
                          Shop Now
                        </a>
                      </>
                    )}
                  </div>
                </div>
              );

              return (
                <div className="relative overflow-hidden">
                  <AnimatePresence initial={false} mode="wait">
                    <motion.div
                      key={displayableOffers[offerSlide].key}
                      initial={{ x: 60, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      exit={{ x: -60, opacity: 0 }}
                      transition={{ duration: 0.45, ease: 'easeInOut' }}
                      className="flex items-center justify-center gap-4 md:gap-6"
                    >
                      {showLeftPeek && (
                        <button onClick={() => setOfferSlide(prevIndex)} aria-label="Previous" className="shrink-0">
                          <SlideCard slide={displayableOffers[prevIndex]} active={false} />
                        </button>
                      )}
                      <SlideCard slide={displayableOffers[offerSlide]} active={true} />
                      {showRightPeek && (
                        <button onClick={() => setOfferSlide(nextIndex)} aria-label="Next" className="shrink-0">
                          <SlideCard slide={displayableOffers[nextIndex]} active={false} />
                        </button>
                      )}
                    </motion.div>
                  </AnimatePresence>
                </div>
              );
            })()}

            {displayableOffers.length > 1 && (
              <div className="flex items-center justify-center gap-2 mt-8">
                {displayableOffers.map((d, i) => (
                  <button
                    key={`dot-${i}`}
                    onClick={() => setOfferSlide(i)}
                    aria-label={`Show offer ${i + 1}`}
                    className={`h-2 rounded-full transition-all duration-300 ${
                      i === offerSlide ? 'w-6 bg-[#3a2f2f]' : 'w-2 bg-[#3a2f2f]/25 hover:bg-[#3a2f2f]/40'
                    }`}
                  />
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {/* ==================== ZIGZAG MODEL GALLERY ==================== */}
      <section className="py-14 md:py-20 bg-white overflow-hidden">
        <div className="max-w-7xl mx-auto px-5 md:px-6">
          <div className="flex flex-col gap-10 md:hidden">
            {[
              { img: 'https://ilzijypghlyourydqhvt.supabase.co/storage/v1/object/public/product-images/ModelMesh3rafLabsaEh.jpeg', title: 'Shoflna ba2a kalam yat2al', sub: 'Effortless style meets everyday comfort' },
              { img: 'https://ilzijypghlyourydqhvt.supabase.co/storage/v1/object/public/product-images/ElMafrodVest.png', title: 'a2ol 7aga', sub: 'Light, breathable, and effortlessly elegant' },
              { img: 'https://ilzijypghlyourydqhvt.supabase.co/storage/v1/object/public/product-images/modelWhiteDress.jpeg', title: '3shan ana mesh 3raf', sub: 'Luxurious fabrics for the modern woman' },
              { img: 'https://ilzijypghlyourydqhvt.supabase.co/storage/v1/object/public/product-images/NafsEl7agaBasLonMo5tlaf.jpeg', title: '5alas', sub: 'Fresh looks inspired by MARIANA' },
            ].map((item, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: false }} transition={{ duration: 0.5, delay: 0.1 * i }} className="flex flex-row items-center gap-5">
                <img src={item.img} alt={item.title} className="w-40 h-48 object-cover rounded-2xl shadow-lg flex-shrink-0" />
                <div>
                  <h3 className="text-xl font-light leading-snug">{item.title}</h3>
                  <p className="text-gray-500 mt-2 text-sm leading-snug">{item.sub}</p>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="hidden md:grid grid-cols-2 gap-16 items-center">
            <div className="space-y-20">
              <motion.div initial={{ opacity: 0, x: -60 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: false }} transition={{ duration: 0.6, delay: 0.4 }} className="flex justify-end gap-12 items-center">
                <img src="https://ilzijypghlyourydqhvt.supabase.co/storage/v1/object/public/product-images/ModelMesh3rafLabsaEh.jpeg" alt="Model 1" className="w-96 rounded-3xl shadow-xl flex-shrink-0" />
                <div className="max-w-[220px]">
                  <h3 className="text-3xl font-light">Shoflna ba2a kalam yat2al</h3>
                  <p className="text-gray-600 mt-3 text-lg leading-tight">Effortless style meets everyday comfort</p>
                </div>
              </motion.div>
              <motion.div initial={{ opacity: 0, x: -60 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: false }} transition={{ duration: 0.6, delay: 0.4 }} className="flex justify-end gap-12 items-center">
                <img src="https://ilzijypghlyourydqhvt.supabase.co/storage/v1/object/public/product-images/ElMafrodVest.png" alt="Model 2" className="w-96 rounded-3xl shadow-xl flex-shrink-0" />
                <div className="max-w-[220px]">
                  <h3 className="text-3xl font-light">a2ol 7aga</h3>
                  <p className="text-gray-600 mt-3 text-lg leading-tight">Light, breathable, and effortlessly elegant</p>
                </div>
              </motion.div>
            </div>

            <div className="space-y-20 lg:mt-90">
              <motion.div initial={{ opacity: 0, x: 60 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: false }} transition={{ duration: 0.6, delay: 0.4 }} className="flex justify-start gap-12 items-center">
                <div className="max-w-[220px] text-left">
                  <h3 className="text-3xl font-light">3shan ana mesh 3raf</h3>
                  <p className="text-gray-600 mt-3 text-lg leading-tight">Luxurious fabrics for the modern woman</p>
                </div>
                <img src="https://ilzijypghlyourydqhvt.supabase.co/storage/v1/object/public/product-images/modelWhiteDress.jpeg" alt="Model 3" className="w-96 rounded-3xl shadow-xl flex-shrink-0" />
              </motion.div>
              <motion.div initial={{ opacity: 0, x: 60 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: false }} transition={{ duration: 0.6, delay: 0.4 }} className="flex justify-start gap-12 items-center">
                <div className="max-w-[220px] text-right">
                  <h3 className="text-3xl font-light">5alas</h3>
                  <p className="text-gray-600 mt-3 text-lg leading-tight">Fresh looks inspired by MARIANA</p>
                </div>
                <img src="https://ilzijypghlyourydqhvt.supabase.co/storage/v1/object/public/product-images/NafsEl7agaBasLonMo5tlaf.jpeg" alt="Model 4" className="w-96 rounded-3xl shadow-xl flex-shrink-0" />
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
                  category={p.category}
                  collection={p.collection}
                  offers={offers}
                />
              ))}
            </motion.div>
          )}
        </div>
      </section>

      {/* ==================== ABOUT ==================== */}
      <section className="py-14 md:py-24 bg-[#f8f4f0] relative overflow-hidden">
        <div className="max-w-4xl mx-auto px-5 md:px-6 text-center relative z-10">
          <h2 className="text-2xl md:text-4xl font-light tracking-widest mb-5 md:mb-6">About GEORIANA</h2>
          <p className="text-sm md:text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
            GEORIANA is a global fashion brand that brings the latest trends to life with exceptional quality and timeless feminine elegance.
          </p>
          <div className="grid grid-cols-2 gap-6 md:gap-12 mt-10 md:mt-16">
            <div>
              <div className="text-4xl md:text-6xl mb-3 md:mb-4">🌸</div>
              <h3 className="text-base md:text-xl font-medium">Timeless Style</h3>
              <p className="text-gray-600 mt-2 text-sm md:text-base">Modern silhouettes with classic feminine appeal</p>
            </div>
            <div>
              <div className="text-4xl md:text-6xl mb-3 md:mb-4">🌿</div>
              <h3 className="text-base md:text-xl font-medium">Sustainable Future</h3>
              <p className="text-gray-600 mt-2 text-sm md:text-base">Committed to responsible and ethical fashion</p>
            </div>
          </div>
        </div>
        <div className="absolute bottom-0 left-4 md:left-12 text-[120px] md:text-[220px] text-[#f5e8d3] opacity-10 pointer-events-none">🌺</div>
        <div className="absolute top-4 md:top-12 right-4 md:right-12 text-[100px] md:text-[180px] text-[#f5e8d3] opacity-10 pointer-events-none">🌼</div>
      </section>
    </>
  );
}