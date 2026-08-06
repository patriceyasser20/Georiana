'use client';

import Image from 'next/image';
import Header from '../components/Header';
import { useTranslation } from '../context/LanguageContext';

export default function About() {
  const { t } = useTranslation();

  return (
    <>
      <Header />

      <section className="min-h-screen bg-gray-50 py-16 md:py-32">
        <div className="max-w-7xl mx-auto px-5 md:px-6">

          <div className="grid items-center gap-8 md:gap-16 lg:grid-cols-2">

            {/* Image */}
            <div className="flex justify-center">
              <Image
                src="/images/Gemini_Generated_Image_nnqt2gnnqt2gnnqt.png"
                alt="Georiana Collection"
                width={700}
                height={1000}
                className="w-full max-w-[500px] h-auto"
                priority
              />
            </div>

            {/* Content */}
            <div className="text-center lg:text-left">
              <h1 className="mb-5 md:mb-10 text-3xl sm:text-4xl md:text-5xl font-light tracking-widest text-black">
                {t('home.aboutTitle')}
              </h1>

              <p className="text-base md:text-lg leading-7 md:leading-9 text-gray-600">
                {t('home.aboutText')}
              </p>
            </div>

          </div>

        </div>
      </section>
    </>
  );
}