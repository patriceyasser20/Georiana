'use client';

import Header from '../components/Header';
import Footer from '../components/Footer';
import { useTranslation } from '../context/LanguageContext';

export default function SizeGuide() {
  const { t } = useTranslation();

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gray-50 py-25">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h1 className="text-5xl font-light tracking-widest mb-12">{t('sizeGuide.title')}</h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">{t('sizeGuide.text')}</p>
          <img src="https://qikink.com/blog/wp-content/uploads/2023/08/Womens-round-neck-half-sleeve-size-chart-qikink-1024x538.webp" className='py-10'></img>
        </div>
      </div>
    </>
  );
}