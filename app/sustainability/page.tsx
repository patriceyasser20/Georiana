'use client';

import Header from '../components/Header';
import Footer from '../components/Footer';
import { useTranslation } from '../context/LanguageContext';

export default function Sustainability() {
  const { t } = useTranslation();

  return (
    <>
   
      <div className="min-h-screen bg-gray-50 py-20 md:py-28">
        <div className="max-w-3xl mx-auto px-6">
          <h1 className="text-5xl font-light tracking-widest mb-6 text-center">
            {t('sustainability.title')}
          </h1>
          <p className="text-lg text-gray-600 text-center mb-16 leading-relaxed">
            {t('sustainability.intro')}
          </p>

          <div className="space-y-12">
            <section>
              <h2 className="text-2xl font-medium mb-4">{t('sustainability.fabricsTitle')}</h2>
              <p className="text-gray-600 leading-relaxed">{t('sustainability.fabricsText')}</p>
            </section>

            <section>
              <h2 className="text-2xl font-medium mb-4">{t('sustainability.craftTitle')}</h2>
              <p className="text-gray-600 leading-relaxed">{t('sustainability.craftText')}</p>
            </section>

            <section>
              <h2 className="text-2xl font-medium mb-4">{t('sustainability.handmadeTitle')}</h2>
              <p className="text-gray-600 leading-relaxed">{t('sustainability.handmadeText')}</p>
            </section>

            <section>
              <h2 className="text-2xl font-medium mb-4">{t('sustainability.commitmentTitle')}</h2>
              <p className="text-gray-600 leading-relaxed">{t('sustainability.commitmentText')}</p>
            </section>
          </div>
        </div>
      </div>
    </>
  );
}