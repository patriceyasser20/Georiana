'use client';

import Link from 'next/link';
import { useTranslation } from '../context/LanguageContext';

export default function Footer() {
  const { t } = useTranslation();

  return (
    <footer className="bg-[#111] text-[#ddd] pt-20 pb-8">
      <div className="max-w-7xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-10 md:gap-12">
        
        {/* Column 1 - Shop */}
        <div className="footer-col">
          <h3 className="text-white text-sm font-medium uppercase tracking-wider mb-5">{t('footer.shop')}</h3>
          <ul className="space-y-3 text-sm">
            <li><a href="#" className="hover:text-white transition-colors">{t('footer.woman')}</a></li>
            <li><a href="#" className="hover:text-white transition-colors">{t('footer.man')}</a></li>
            <li><a href="#" className="hover:text-white transition-colors">{t('footer.kids')}</a></li>
            <li><a href="#" className="hover:text-white transition-colors">{t('footer.newCollection')}</a></li>
            <li><a href="#" className="hover:text-white transition-colors">{t('footer.sale')}</a></li>
          </ul>
        </div>

        {/* Column 2 - Help */}
        <div className="footer-col">
          <h3 className="text-white text-sm font-medium uppercase tracking-wider mb-5">{t('footer.help')}</h3>
          <ul className="space-y-3 text-sm">
            <li><Link href="/about" className="hover:text-white transition-colors">{t('footer.aboutUs')}</Link></li>
            <li><a href="#" className="hover:text-white transition-colors">{t('footer.trackOrder')}</a></li>
            <li><Link href="/customer-service" className="hover:text-white transition-colors">{t('footer.customerService')}</Link></li>
            <li><Link href="/return-exchange" className="hover:text-white transition-colors">{t('footer.returns')}</Link></li>
            <li><Link href="/size-guide" className="hover:text-white transition-colors">{t('footer.sizeGuide')}</Link></li>
            <li><Link href="/contact" className="hover:text-white transition-colors">{t('footer.contactUs')}</Link></li>
          </ul>
        </div>

        {/* Column 3 - About Zara */}
        <div className="footer-col">
          <h3 className="text-white text-sm font-medium uppercase tracking-wider mb-5">{t('footer.aboutZara')}</h3>
          <ul className="space-y-3 text-sm">
            <li><a href="#" className="hover:text-white transition-colors">{t('footer.ourStory')}</a></li>
            <li><a href="#" className="hover:text-white transition-colors">{t('footer.careers')}</a></li>
            <li><a href="#" className="hover:text-white transition-colors">{t('footer.press')}</a></li>
            <li><a href="#" className="hover:text-white transition-colors">{t('footer.sustainability')}</a></li>
          </ul>
        </div>

        {/* Column 4 - Newsletter */}
        <div className="footer-col">
          <h3 className="text-white text-sm font-medium uppercase tracking-wider mb-5">{t('footer.newsletter')}</h3>
          <p className="mb-4 leading-relaxed text-sm">
            {t('footer.newsletterText')}
          </p>
          
          <div className="newsletter">
            <form id="newsletterForm" className="space-y-3">
              <input
                type="email"
                id="newsEmail"
                placeholder={t('footer.emailPlaceholder')}
                required
                className="w-full px-4 py-3 bg-[#222] border border-[#444] text-white placeholder-gray-500 focus:outline-none focus:border-white rounded-sm"
              />
              <button
                type="submit"
                className="w-full py-3 bg-white text-black font-medium tracking-wider hover:bg-gray-200 transition-colors rounded-sm"
              >
                {t('footer.subscribe')}
              </button>
            </form>
          </div>

          {/* Payment icons */}
          <div className="payment-icons flex flex-wrap gap-4 mt-8">
            <img src="/images/visa.jpg" alt="Visa" className="h-6 opacity-80" />
            <img src="/images/mastercard.jpg" alt="Mastercard" className="h-6 opacity-80" />
            <img src="/images/fawry.jpg" alt="Fawry" className="h-6 opacity-80" />
            <img src="/images/paypal.jpg" alt="PayPal" className="h-6 opacity-80" />
          </div>
        </div>
      </div>

      {/* Copyright bar */}
      <div className="mt-16 pt-8 border-t border-[#333] text-center text-xs text-gray-500">
        <div className="max-w-7xl mx-auto">
          {t('footer.copyright')} • {t('footer.madeInEgypt')}
        </div>
      </div>
    </footer>
  );
}