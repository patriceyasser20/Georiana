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
            <div className="relative h-[280px] sm:h-[380px] md:h-[500px] overflow-hidden rounded-lg shadow-lg">
              <Image
                src="https://www.thefashionlaw.com/wp-content/uploads/2017/04/Steven-Meisel-ZARA-Spring-2017-1024x579.jpg"
                alt="Georiana Collection"
                fill
                className="object-cover"
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