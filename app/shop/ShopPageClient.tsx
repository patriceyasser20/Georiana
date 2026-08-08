'use client';

import { useState, useEffect } from 'react';
import Header from '../components/Header';
import ProductCard from '../components/ProductCard';
import { useCurrency } from '../context/CurrencyContext';
import { ArrowUp } from 'lucide-react';
import { setCached } from '../../lib/productCache';
import { type Offer } from '../../lib/offers';
import { useTranslation } from '../context/LanguageContext';

type Props = {
  initialProducts: any[];
  initialOffers: Offer[];
};

export default function ShopPageClient({ initialProducts, initialOffers }: Props) {
  const { formatPrice } = useCurrency();

  const [products] = useState<any[]>(initialProducts);
  const [filteredProducts, setFilteredProducts] = useState<any[]>(initialProducts);
  const [offers] = useState<Offer[]>(initialOffers);
  const [searchTerm, setSearchTerm] = useState('');
  const [showTopButton, setShowTopButton] = useState(false);
  const { t } = useTranslation();

  // Prime the client-side cache with the server-fetched data so other
  // pages (Header categories, other client fetches) that read from
  // productCache still get a warm hit instead of re-fetching.
  useEffect(() => {
    setCached('all-products', initialProducts);
    setCached('active-offers', initialOffers, 5 * 60 * 1000);
  }, [initialProducts, initialOffers]);

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

          {filteredProducts.length === 0 ? (
            <p className="text-center py-20 text-xl text-gray-500">
              No products found for "{searchTerm}"
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-8">
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