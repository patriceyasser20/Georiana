'use client';

import Link from 'next/link';
import { useTranslation } from '../context/LanguageContext';

export default function Footer() {
  const { t } = useTranslation();

  return (
    <footer className="bg-[#111] text-[#ddd] pt-14 md:pt-20 pb-8">
      <div className="max-w-4xl mx-auto px-6">

        {/* ── 3-column grid, centered ── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12 text-center md:text-left">

          {/* Follow Us */}
          <div className="flex flex-col items-center md:items-start">
            <h3 className="text-white text-sm font-medium uppercase tracking-wider mb-4 md:mb-5">Follow Us</h3>
            <div className="flex items-center gap-4">
              <a
                href="https://www.facebook.com/profile.php?id=61552738303653&mibextid=wwXIfr&rdid=uXmFuclixl3u7NSF&share_url=https%3A%2F%2Fwww.facebook.com%2Fshare%2F1DwuGFejMy%2F%3Fmibextid%3DwwXIfr#"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:scale-110 transition-transform"
              >
                <img src="/images/facebook.webp" alt="Facebook" className="h-10 w-10 md:h-14 md:w-14 rounded-xl" />
              </a>
              <a
                href="https://www.instagram.com/georiana1?igsh=bXJ2ZjA2ODk1cWcw&utm_source=qr"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:scale-110 transition-transform"
              >
                <img src="/images/instgram.webp" alt="Instagram" className="h-10 w-10 md:h-14 md:w-14 rounded-xl" />
              </a>
              <a
                href="https://www.tiktok.com/@georiana_?_r=1&_t=ZS-95MxDFRR0QH"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:scale-110 transition-transform"
              >
                <img src="/images/tiktok.png" alt="TikTok" className="h-10 w-10 md:h-14 md:w-14 rounded-xl" />
              </a>
            </div>
          </div>

          {/* Help */}
          <div className="flex flex-col items-center md:items-start">
            <h3 className="text-white text-sm font-medium uppercase tracking-wider mb-4 md:mb-5">
              {t('footer.help')}
            </h3>
            <ul className="space-y-2 md:space-y-3 text-sm">
              <li><Link href="/about" className="hover:text-white transition-colors">{t('footer.aboutUs')}</Link></li>
              <li><a href="#" className="hover:text-white transition-colors">{t('footer.trackOrder')}</a></li>
              <li><Link href="/customer-service" className="hover:text-white transition-colors">{t('footer.customerService')}</Link></li>
              <li><Link href="/return-exchange" className="hover:text-white transition-colors">{t('footer.returns')}</Link></li>
              <li><Link href="/size-guide" className="hover:text-white transition-colors">{t('footer.sizeGuide')}</Link></li>
              <li><Link href="/contact" className="hover:text-white transition-colors">{t('footer.contactUs')}</Link></li>
            </ul>
          </div>

          {/* About */}
          <div className="flex flex-col items-center md:items-start">
            <h3 className="text-white text-sm font-medium uppercase tracking-wider mb-4 md:mb-5">
              {t('footer.aboutZara')}
            </h3>
            <ul className="space-y-2 md:space-y-3 text-sm">
              <li><a href="#" className="hover:text-white transition-colors">{t('footer.ourStory')}</a></li>
              <li><a href="#" className="hover:text-white transition-colors">{t('footer.careers')}</a></li>
              <li><a href="#" className="hover:text-white transition-colors">{t('footer.press')}</a></li>
              <li><a href="#" className="hover:text-white transition-colors">{t('footer.sustainability')}</a></li>
            </ul>
          </div>

        </div>
      </div>

      {/* Copyright */}
      <div className="mt-12 md:mt-16 pt-8 border-t border-[#333] text-center text-xs text-gray-500 px-6">
        {t('footer.copyright')} • {t('footer.madeInEgypt')}
      </div>
    </footer>
  );
}