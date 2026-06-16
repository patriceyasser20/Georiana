'use client';

import Header from '../components/Header';
import Footer from '../components/Footer';
import { useTranslation } from '../context/LanguageContext';

export default function Contact() {
  const { t } = useTranslation();

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gray-50 py-20">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h1 className="text-5xl font-light tracking-widest mb-12">{t('contact.title')}</h1>
          
          <div className="grid md:grid-cols-2 gap-12">
            <div>
              <h2 className="text-2xl font-medium mb-6">{t('contact.getInTouch')}</h2>
              <p className="text-gray-600 mb-8">{t('contact.getInTouchText')}</p>
              <p className="text-lg">📧 support@pawlo.com</p>
              <p className="text-lg">📞 +1 234 567 890</p>
            </div>
            <div>
              <h2 className="text-2xl font-medium mb-6">{t('contact.ourOffice')}</h2>
              <p className="text-gray-600">{t('contact.address')}</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}