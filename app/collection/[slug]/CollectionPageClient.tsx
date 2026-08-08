'use client';

import Header from '../../components/Header';
import ProductCard from '../../components/ProductCard';
import { useCurrency } from '../../context/CurrencyContext';
import { useTranslation } from '../../context/LanguageContext';

type Props = {
  products: any[];
  displayName: string;
};

export default function CollectionPageClient({ products, displayName }: Props) {
  const { formatPrice } = useCurrency();
  const { t } = useTranslation();

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gray-50 py-22">
        <div className="max-w-7xl mx-auto px-6">
          <h1 className="text-5xl font-light tracking-widest mb-10">
            {t('collection.label')} — <bdi>{displayName}</bdi>
          </h1>

          {products.length === 0 ? (
            <p className="text-center py-20 text-xl text-gray-500">
              {t('collection.noProducts')}
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {products.map((p) => (
                <ProductCard
                  key={p.id}
                  id={p.id}
                  name={p.name}
                  price={p.price}
                  img={p.thumbnail_url || p.images?.[0] || ''}
                  isOnSale={p.is_on_sale}
                  discountPercentage={p.discount_percentage}
                  hasVariantSale={p.product_variants?.some((v: any) => v.is_on_sale)}
                  maxVariantDiscount={Math.max(...(p.product_variants?.filter((v: any) => v.is_on_sale).map((v: any) => v.discount_percentage) || [0]))}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}