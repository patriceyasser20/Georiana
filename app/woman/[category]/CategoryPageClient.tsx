'use client';

import Header from '../../components/Header';
import ProductCard from '../../components/ProductCard';
import { useCurrency } from '../../context/CurrencyContext';
import { useTranslation } from '../../context/LanguageContext';

type Props = {
  products: any[];
  categorySlug: string;
};

export default function CategoryPageClient({ products, categorySlug }: Props) {
  const { formatPrice } = useCurrency();
  const { t } = useTranslation();

  const translatedCategory = t(`category.${categorySlug}`);
  const displayName = translatedCategory !== `category.${categorySlug}`
    ? translatedCategory
    : categorySlug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gray-50 py-22">
        <div className="max-w-7xl mx-auto px-6">
          <h1 className="text-5xl font-light tracking-widest mb-10">
            {t('header.woman')} — {displayName}
          </h1>

          {products.length === 0 ? (
            <p className="text-center py-20 text-xl text-gray-500">{t('common.noCategories')}</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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