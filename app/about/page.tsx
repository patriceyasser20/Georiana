'use client';

import Image from 'next/image';
import Header from '../components/Header';
import { useTranslation } from '../context/LanguageContext';

export default function About() {
  const { t } = useTranslation();

  return (
    <>
      <Header />

      <section className="min-h-screen bg-gray-50 py-32">
        <div className="max-w-7xl mx-auto px-6">

          <div className="grid items-center gap-16 lg:grid-cols-2">

            {/* Image */}
            <div className="relative h-[500px] overflow-hidden rounded-lg shadow-lg">
              <Image
                src="/images/about.jpg"
                alt="Georiana Collection"
                fill
                className="object-cover"
                priority
              />
            </div>

            {/* Content */}
            <div>
              <h1 className="mb-10 text-5xl font-light tracking-widest text-black">
                {t('home.aboutTitle')}
              </h1>

              <p className="text-lg leading-9 text-gray-600">
                {t('home.aboutText')}
              </p>
            </div>

          </div>

        </div>
      </section>
    </>
  );
}