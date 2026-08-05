'use client';

import Header from '../components/Header';
import Footer from '../components/Footer';
import { useTranslation } from '../context/LanguageContext';

export default function OurStory() {
  const { t } = useTranslation();

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gray-50 py-20 md:py-28">
        <div className="max-w-3xl mx-auto px-6">
          <h1 className="text-5xl font-light tracking-widest mb-16 text-center">
            {t('ourStory.title')}
          </h1>

          <div className="space-y-8 text-lg text-gray-600 leading-relaxed">
            <p>{t('ourStory.p1')}</p>
            <p>{t('ourStory.p2')}</p>
            <p>{t('ourStory.p3')}</p>
            <p>{t('ourStory.p4')}</p>
            <p>{t('ourStory.p5')}</p>
            <p>{t('ourStory.p6')}</p>
          </div>

          <p className="text-center text-2xl font-light tracking-wide text-black mt-16 pt-10 border-t">
            {t('ourStory.tagline')}
          </p>
        </div>
      </div>
    </>
  );
}