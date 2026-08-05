'use client';

import Header from '../components/Header';
import Footer from '../components/Footer';
import { useTranslation } from '../context/LanguageContext';

export default function ReturnExchange() {
  const { t } = useTranslation();

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gray-50 py-20 md:py-28">
        <div className="max-w-3xl mx-auto px-6">
          <h1 className="text-5xl font-light tracking-widest mb-6 text-center">
            {t('returnExchange.title')}
          </h1>
          <p className="text-lg text-gray-600 text-center mb-16">
            {t('returnExchange.text')}
          </p>

          <div className="space-y-12">
            {/* Returns */}
            <section>
              <h2 className="text-2xl font-medium mb-4">{t('returnExchange.returnsTitle')}</h2>
              <p className="text-gray-600 leading-relaxed">{t('returnExchange.returnsText')}</p>
            </section>

            {/* Exchanges */}
            <section>
              <h2 className="text-2xl font-medium mb-4">{t('returnExchange.exchangesTitle')}</h2>
              <p className="text-gray-600 leading-relaxed mb-4">{t('returnExchange.exchangesIntro')}</p>
              <ul className="space-y-2 text-gray-600 list-disc ps-5">
                <li>{t('returnExchange.exchangeCondition1')}</li>
                <li>{t('returnExchange.exchangeCondition2')}</li>
                <li>{t('returnExchange.exchangeCondition3')}</li>
              </ul>
            </section>

            {/* Size Trial Service */}
            <section>
              <h2 className="text-2xl font-medium mb-4">{t('returnExchange.sizeTrialTitle')}</h2>
              <p className="text-gray-600 leading-relaxed">{t('returnExchange.sizeTrialText')}</p>
            </section>

            {/* Inspection Before Payment */}
            <section>
              <h2 className="text-2xl font-medium mb-4">{t('returnExchange.inspectionTitle')}</h2>
              <p className="text-gray-600 leading-relaxed">{t('returnExchange.inspectionText')}</p>
            </section>

            {/* Shipping Fees */}
            <section>
              <h2 className="text-2xl font-medium mb-4">{t('returnExchange.shippingFeesTitle')}</h2>
              <p className="text-gray-600 leading-relaxed">{t('returnExchange.shippingFeesText')}</p>
            </section>
          </div>
        </div>
      </div>
    </>
  );
}