'use client';

import Header from '../components/Header';
import Footer from '../components/Footer';
import { useTranslation } from '../context/LanguageContext';

export default function CustomerService() {
  const { t } = useTranslation();

  return (
    <>
    
      <div className="min-h-screen bg-gray-50 py-25">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h1 className="text-5xl font-light tracking-widest mb-12">{t('customerService.title')}</h1>
          
          <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-12">
            {t('customerService.text')}
          </p>

          <div className="grid md:grid-cols-2 gap-12 max-w-md mx-auto">
            <div className="bg-white rounded-3xl p-8">
              <h2 className="text-2xl font-medium mb-4">{t('customerService.emailSupport')}</h2>
              <p className="text-lg">support@GEORIANA.com</p>
            </div>
            <div className="bg-white rounded-3xl p-8">
              <h2 className="text-2xl font-medium mb-4">{t('customerService.phoneSupport')}</h2>
              <p className="text-lg">+1 234 567 890</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}