'use client';

import Link from 'next/link';
import { useTranslation } from '../context/LanguageContext';

export default function Footer() {
  const { t } = useTranslation();

  return (
    <footer className="bg-[#111] text-[#ddd] pt-12 md:pt-24 pb-8">
      <div className="max-w-7xl mx-auto px-10">

        {/* ── Brand block — full width on mobile, first column on desktop ── */}
        <div className="flex flex-col items-center text-center md:hidden mb-10">
          <img
            src="/images/logo.svg"
            alt="GEORIANA"
            className="h-10 w-auto brightness-0 invert mb-4"
          />
          <p className="text-sm text-gray-400 leading-relaxed max-w-[260px] mb-5">
            Modern women's fashion — designed for the woman who wears life intuitively.
          </p>
          <div className="flex items-center gap-4">
            <a href="https://www.facebook.com/profile.php?id=61552738303653&mibextid=wwXIfr&rdid=uXmFuclixl3u7NSF&share_url=https%3A%2F%2Fwww.facebook.com%2Fshare%2F1DwuGFejMy%2F%3Fmibextid%3DwwXIfr#" target="_blank" rel="noopener noreferrer" className="hover:scale-110 transition-transform">
              <img src="/images/facebook.webp" alt="Facebook" className="h-9 w-9 rounded-lg" />
            </a>
            <a href="https://www.instagram.com/georiana1?igsh=bXJ2ZjA2ODk1cWcw&utm_source=qr" target="_blank" rel="noopener noreferrer" className="hover:scale-110 transition-transform">
              <img src="/images/instgram.webp" alt="Instagram" className="h-9 w-9 rounded-lg" />
            </a>
            <a href="https://www.tiktok.com/@georiana_?_r=1&_t=ZS-95MxDFRR0QH" target="_blank" rel="noopener noreferrer" className="hover:scale-110 transition-transform">
              <img src="/images/tiktok.png" alt="TikTok" className="h-9 w-9 rounded-lg" />
            </a>
          </div>
        </div>

        {/* ── Mobile: 2-col link grid ── */}
        <div className="grid grid-cols-2 gap-8 md:hidden mb-10">
          {/* Help */}
          <div>
            <h3 className="text-white text-xs font-semibold uppercase tracking-[0.15em] mb-4">
              {t('footer.help')}
            </h3>
            <ul className="space-y-2.5 text-sm">
              <li><Link href="/about" className="hover:text-white transition-colors">{t('footer.aboutUs')}</Link></li>
              <li><a href="#" className="hover:text-white transition-colors">{t('footer.trackOrder')}</a></li>
              <li><Link href="/customer-service" className="hover:text-white transition-colors">{t('footer.customerService')}</Link></li>
              <li><Link href="/return-exchange" className="hover:text-white transition-colors">{t('footer.returns')}</Link></li>
              <li><Link href="/size-guide" className="hover:text-white transition-colors">{t('footer.sizeGuide')}</Link></li>
              <li><Link href="/contact" className="hover:text-white transition-colors">{t('footer.contactUs')}</Link></li>
            </ul>
          </div>

          {/* About + Contact stacked */}
          <div className="flex flex-col gap-8">
            <div>
              <h3 className="text-white text-xs font-semibold uppercase tracking-[0.15em] mb-4">
                {t('footer.aboutZara')}
              </h3>
              <ul className="space-y-2.5 text-sm">
                <li><a href="#" className="hover:text-white transition-colors">{t('footer.ourStory')}</a></li>
                <li><a href="#" className="hover:text-white transition-colors">{t('footer.careers')}</a></li>
                <li><a href="#" className="hover:text-white transition-colors">{t('footer.press')}</a></li>
                <li><a href="#" className="hover:text-white transition-colors">{t('footer.sustainability')}</a></li>
              </ul>
            </div>
            <div>
              <h3 className="text-white text-xs font-semibold uppercase tracking-[0.15em] mb-4">Contact</h3>
              <ul className="space-y-2.5 text-sm text-gray-400">
                <li>📧 support@georiana.com</li>
                <li>📍 Cairo, Egypt</li>
                <li>🕐 Sat–Thu 10AM–9PM</li>
              </ul>
            </div>
          </div>
        </div>

        {/* ── Desktop: 4-column grid ── */}
        <div className="hidden md:grid md:grid-cols-4 gap-8">

          {/* Brand block */}
          <div className="flex flex-col items-start gap-5">
            <img src="/images/logo.svg" alt="GEORIANA" className="h-14 w-auto brightness-0 invert" />
            <p className="text-sm text-gray-400 leading-relaxed max-w-[220px]">
              Modern women's fashion — designed for the woman who wears life intuitively.
            </p>
            <div className="flex items-center gap-3">
              <a href="https://www.facebook.com/profile.php?id=61552738303653&mibextid=wwXIfr&rdid=uXmFuclixl3u7NSF&share_url=https%3A%2F%2Fwww.facebook.com%2Fshare%2F1DwuGFejMy%2F%3Fmibextid%3DwwXIfr#" target="_blank" rel="noopener noreferrer" className="hover:scale-110 transition-transform">
                <img src="/images/facebook.webp" alt="Facebook" className="h-9 w-9 rounded-lg" />
              </a>
              <a href="https://www.instagram.com/georiana1?igsh=bXJ2ZjA2ODk1cWcw&utm_source=qr" target="_blank" rel="noopener noreferrer" className="hover:scale-110 transition-transform">
                <img src="/images/instgram.webp" alt="Instagram" className="h-9 w-9 rounded-lg" />
              </a>
              <a href="https://www.tiktok.com/@georiana_?_r=1&_t=ZS-95MxDFRR0QH" target="_blank" rel="noopener noreferrer" className="hover:scale-110 transition-transform">
                <img src="/images/tiktok.png" alt="TikTok" className="h-9 w-9 rounded-lg" />
              </a>
            </div>
          </div>

          {/* Help */}
          <div>
            <h3 className="text-white text-xs font-semibold uppercase tracking-[0.15em] mb-5">
              {t('footer.help')}
            </h3>
            <ul className="space-y-3 text-sm">
              <li><Link href="/about" className="hover:text-white transition-colors">{t('footer.aboutUs')}</Link></li>
              <li><a href="#" className="hover:text-white transition-colors">{t('footer.trackOrder')}</a></li>
              <li><Link href="/customer-service" className="hover:text-white transition-colors">{t('footer.customerService')}</Link></li>
              <li><Link href="/return-exchange" className="hover:text-white transition-colors">{t('footer.returns')}</Link></li>
              <li><Link href="/size-guide" className="hover:text-white transition-colors">{t('footer.sizeGuide')}</Link></li>
              <li><Link href="/contact" className="hover:text-white transition-colors">{t('footer.contactUs')}</Link></li>
            </ul>
          </div>

          {/* About */}
          <div>
            <h3 className="text-white text-xs font-semibold uppercase tracking-[0.15em] mb-5">
              {t('footer.aboutZara')}
            </h3>
            <ul className="space-y-3 text-sm">
              <li><a href="#" className="hover:text-white transition-colors">{t('footer.ourStory')}</a></li>
              <li><a href="#" className="hover:text-white transition-colors">{t('footer.careers')}</a></li>
              <li><a href="#" className="hover:text-white transition-colors">{t('footer.press')}</a></li>
              <li><a href="#" className="hover:text-white transition-colors">{t('footer.sustainability')}</a></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-white text-xs font-semibold uppercase tracking-[0.15em] mb-5">Contact</h3>
            <ul className="space-y-3 text-sm text-gray-400">
              <li className="flex items-start gap-2">
                <span className="mt-0.5">📧</span>
                <span>support@georiana.com</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-0.5">📍</span>
                <span>Cairo, Egypt</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-0.5">🕐</span>
                <span>Sat – Thu<br />10:00 AM – 9:00 PM</span>
              </li>
            </ul>
          </div>

        </div>

        {/* ── Bottom bar ── */}
        <div className="mt-12 md:mt-20 pt-8 border-t border-[#2a2a2a] flex flex-col items-center gap-4">
          <p className="text-xs text-gray-500 text-center">
            {t('footer.copyright')} • {t('footer.madeInEgypt')}
          </p>
        </div>

      </div>
    </footer>
  );
}