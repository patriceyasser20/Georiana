'use client';

import { useState, useEffect } from 'react';
import Header from '../components/Header';
import ProductCard from '../components/ProductCard';
import { supabaseClient } from '../../lib/supabaseClient';
import { useCurrency } from '../context/CurrencyContext';
import { ArrowUp } from 'lucide-react';
import { getCached, setCached } from '../../lib/productCache';
import { type Offer } from '../../lib/offers';
import { useTranslation } from '../context/LanguageContext';

export default function Shop() {
  const { formatPrice } = useCurrency();

  const [products, setProducts] = useState<any[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<any[]>([]);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [showTopButton, setShowTopButton] = useState(false);
  const { t } = useTranslation();

  // Fetch all products
  useEffect(() => {
    const fetchProducts = async () => {
      const cacheKey = 'all-products';
      const cached = getCached(cacheKey);
      if (cached) {
        setProducts(cached);
        setFilteredProducts(cached);
        setLoading(false);
        return;
      }

      const { data, error } = await supabaseClient
        .from('products')
        .select('id, name, name_ar, price, images, is_on_sale, discount_percentage, category, collection, collection_ar')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching products:', error);
      } else {
        setCached(cacheKey, data || []);
        setProducts(data || []);
        setFilteredProducts(data || []);
      }
      setLoading(false);
    };

    fetchProducts();
  }, []);

  // Fetch active offers (for product badges)
  useEffect(() => {
    const fetchOffers = async () => {
      const cacheKey = 'active-offers';
      const cached = getCached(cacheKey);
      if (cached) { setOffers(cached as Offer[]); return; }

      const { data } = await supabaseClient
        .from('offers')
        .select('*')
        .eq('is_active', true);

      setCached(cacheKey, data || [], 5 * 60 * 1000); // 5 min TTL
      setOffers((data || []) as Offer[]);
    };
    fetchOffers();
  }, []);

  // Filter products when search term changes
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredProducts(products);
    } else {
      const term = searchTerm.toLowerCase().trim();
      const filtered = products.filter(product =>
        product.name.toLowerCase().includes(term) ||
        (product.description && product.description.toLowerCase().includes(term)) ||
        (product.category && product.category.toLowerCase().includes(term))
      );
      setFilteredProducts(filtered);
    }
  }, [searchTerm, products]);

  // Show "Top" button when scrolled down
  useEffect(() => {
    const handleScroll = () => {
      setShowTopButton(window.scrollY > 500);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gray-50 py-22 ">
        <div className="max-w-7xl mx-auto px-6 ">
          <h1 className="text-5xl font-light tracking-widest mb-10">{t('shop.title')}</h1>

          {/* Search Bar */}
          <div className="mb-10 max-w-xl">
            <div className="relative">
              <input
                type="text"
                placeholder={t('shop.search')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full border border-gray-300 rounded-2xl px-6 py-4 text-lg focus:outline-none focus:border-black placeholder-gray-400"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute end-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-black"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {loading ? (
            <p className="text-center py-20">{t('shop.loading')}</p>
          ) : filteredProducts.length === 0 ? (
            <p className="text-center py-20 text-xl text-gray-500">
              {t('shop.noResultsFor')} "{searchTerm}"
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4  gap-8">
              {filteredProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  id={product.id}
                  name={product.name}
                  price={product.price}
                  img={product.images?.[0] || ''}
                  isOnSale={product.is_on_sale}
                  discountPercentage={product.discount_percentage}
                  hasVariantSale={product.product_variants?.some((v: any) => v.is_on_sale)}
                  maxVariantDiscount={Math.max(...(product.product_variants?.filter((v: any) => v.is_on_sale).map((v: any) => v.discount_percentage) || [0]))}
                  category={product.category}
                  collection={product.collection}
                  offers={offers}
                />
              ))}
            </div>
          )}
          {/* FIXED CIRCULAR TOP BUTTON - HARD RIGHT */}
          {showTopButton && (
            <button
              onClick={scrollToTop}
              className="fixed bottom-8 right-8 bg-black text-white w-14 h-14 rounded-full flex items-center justify-center shadow-2xl hover:bg-gray-800 transition-all z-50"
              aria-label="Back to top"
            >
              <ArrowUp size={24} />
            </button>
          )}
        </div>
      </div>
    </>
  );
}