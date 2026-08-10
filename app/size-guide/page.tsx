'use client';

import Header from '../components/Header';
import Footer from '../components/Footer';
import { useTranslation } from '../context/LanguageContext';
import Image from "next/image";

export default function SizeGuide() {
  const { t } = useTranslation();

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gray-50 py-30">
        <div className="max-w-7xl mx-auto px-2 text-center">
          <h1 className="text-5xl font-light tracking-widest mb-5">{t('sizeGuide.title')}</h1>
          <div className='text-xl text-gray-600 max-w-2xl mx-auto'><p>{t('sizeGuide.text')}</p></div>
           <img src="https://qhtselljfzsavnltrhsh.supabase.co/storage/v1/object/public/product-images/size.png" className='py-10'></img>
        </div>
      </div>
    </>
  );
}