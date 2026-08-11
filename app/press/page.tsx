'use client';

import Header from '../components/Header';
import Footer from '../components/Footer';
import { useTranslation } from '../context/LanguageContext';

export default function Press() {
  const { t } = useTranslation();

  return (
    <>
      <div className="min-h-screen bg-gray-50 py-20 md:py-28">
        <div className="max-w-3xl mx-auto px-6">
          <h1 className="text-5xl font-light tracking-widest mb-6 text-center">
            {t('press.title')}
          </h1>
          <p className="text-lg text-gray-600 text-center mb-16 leading-relaxed">
            {t('press.intro')}
          </p>

          <div className="space-y-12">
            <section>
              <h2 className="text-2xl font-medium mb-4">{t('press.contactTitle')}</h2>
              <p className="text-gray-600 leading-relaxed mb-3">{t('press.contactText')}</p>
              <a href='https://www.instagram.com/georiana_brand?igsh=eDFrbHM5dDliZHE='
                className="inline-block text-black font-medium underline"
              >
                {t('press.chatWithUs')}
              </a>
            </section>

            <section>
              <h2 className="text-2xl font-medium mb-4">{t('press.assetsTitle')}</h2>
              <p className="text-gray-600 leading-relaxed">{t('press.assetsText')}</p>
            </section>
          </div>
        </div>
      </div>
    </>
  );
}