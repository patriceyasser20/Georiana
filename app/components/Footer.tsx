'use client';

import Link from 'next/link';
import { useTranslation } from '../context/LanguageContext';
import { FaWhatsapp } from "react-icons/fa";

export default function Footer() {
  const { t, language } = useTranslation();

  const isArabic = language === "ar";

  return (
   <footer className="bg-[#111] text-[#ddd] pt-5 md:pt-1">
      <div className="max-w-7xl mx-auto px-10 pt-12">

        {/* ── Brand block — full width on mobile, first column on desktop ── */}
        <div className="flex flex-col items-center text-center md:hidden mb-10">
          <img
            src="/images/logo.svg"
            alt="GEORIANA"
            className="h-10 w-auto brightness-0 invert mb-4"
          />
          <p className="text-sm text-gray-400 leading-relaxed max-w-65 mb-5">
            {t('footer.brandTagline')}
          </p>
          <div className="flex items-center gap-4">
            <a href="https://www.facebook.com/profile.php?id=61552738303653&mibextid=wwXIfr&rdid=uXmFuclixl3u7NSF&share_url=https%3A%2F%2Fwww.facebook.com%2Fshare%2F1DwuGFejMy%2F%3Fmibextid%3DwwXIfr#" target="_blank" rel="noopener noreferrer" className="hover:scale-110 transition-transform">
              <img src="/images/facebook.webp" alt="Facebook" className="h-9 w-9 rounded-lg" />
            </a>
            <a href="https://www.instagram.com/georiana_brand?igsh=eDFrbHM5dDliZHE=" target="_blank" rel="noopener noreferrer" className="hover:scale-110 transition-transform">
              <img src="/images/instgram.webp" alt="Instagram" className="h-9 w-9 rounded-lg" />
            </a>
            <a href="https://www.tiktok.com/@georiana_?_r=1&_t=ZS-95MxDFRR0QH" target="_blank" rel="noopener noreferrer" className="hover:scale-110 transition-transform">
              <img src="/images/tiktok.png" alt="TikTok" className="h-12 w-12 rounded-lg" />
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
            <ul className={`space-y-3 ${isArabic ? "text-base" : "text-lg"}`}>
              <li><Link href="/about" className="hover:text-white transition-colors">{t('footer.aboutUs')}</Link></li>
              <li><Link href="/return-exchange" className="hover:text-white transition-colors">{t('footer.returns')}</Link></li>
              <li><Link href="/size-guide" className="hover:text-white transition-colors">{t('footer.sizeGuide')}</Link></li>
            </ul>
          </div>

          {/* About + Contact stacked */}
          <div className="flex flex-col gap-8">
            <div>
              <h3 className="text-white text-xs font-semibold uppercase tracking-[0.15em] mb-4">
                {t('footer.aboutZara')}
              </h3>
              <ul className={`space-y-3 ${isArabic ? "text-base" : "text-sm"}`}>
                <li><a href="/our-story" className="hover:text-white transition-colors">{t('footer.ourStory')}</a></li>
                <li><a href="/press" className="hover:text-white transition-colors">{t('footer.press')}</a></li>
                <li><a href="/sustainability" className="hover:text-white transition-colors">{t('footer.sustainability')}</a></li>
              </ul>
            </div>
            <div>
              <h3 className="text-white text-xs font-semibold uppercase tracking-[0.15em] mb-4">
                {t('footer.contactHeader')}
              </h3>
              <ul className="space-y-2.5 text-sm text-gray-400">
                <li className="flex items-center gap-2">
                  <span className="flex-shrink-0">📧</span>
                  <a
                    href={`mailto:${t('footer.contactEmail')}`}
                    className="hover:text-white transition-colors"
                    dir="ltr"
                  >
                    {t('footer.contactEmail')}
                  </a>
                </li>
                <li>🕐 {t('footer.contactHoursDays')} {t('footer.contactHoursTime')}</li>
              </ul>
            </div>
          </div>
        </div>

        {/* ── Desktop: 4-column grid ── */}
        <div className="hidden md:grid md:grid-cols-4 gap-8">

          {/* Brand block */}
          <div className="flex flex-col items-start gap-5">
            <img src="/images/logo.svg" alt="GEORIANA" className="h-14 w-auto brightness-0 invert" />
            <p className="text-sm text-gray-400 leading-relaxed max-w-55">
              {t('footer.brandTagline')}
            </p>
            <div className="flex items-center gap-3">
              <a href="https://www.facebook.com/profile.php?id=61552738303653" target="_blank" rel="noopener noreferrer" className="hover:scale-110 transition-transform">
                <img src="/images/facebook.webp" alt="Facebook" className="h-9 w-9 rounded-lg" />
              </a>
              <a href="https://www.instagram.com/georiana1?igsh=bXJ2ZjA2ODk1cWcw&utm_source=qr" target="_blank" rel="noopener noreferrer" className="hover:scale-110 transition-transform">
                <img src="/images/instgram.webp" alt="Instagram" className="h-9 w-9 rounded-lg" />
              </a>
              <a href="https://www.tiktok.com/@georiana_?_r=1&_t=ZS-95MxDFRR0QH" target="_blank" rel="noopener noreferrer" className="hover:scale-110 transition-transform">
                <img src="/images/tiktok.png" alt="TikTok" className="h-12 w-12 rounded-lg" />
              </a>
            </div>
          </div>

          {/* Help */}
          <div>
            <h3 className="text-white text-xs font-semibold uppercase tracking-[0.15em] mb-5">
              {t('footer.help')}
            </h3>
            <ul className={`space-y-3 ${isArabic ? "text-base" : "text-sm"}`}>
              <li><Link href="/about" className="hover:text-white transition-colors">{t('footer.aboutUs')}</Link></li>
              <li><Link href="/return-exchange" className="hover:text-white transition-colors">{t('footer.returns')}</Link></li>
              <li><Link href="/size-guide" className="hover:text-white transition-colors">{t('footer.sizeGuide')}</Link></li>
            </ul>
          </div>

          {/* About */}
          <div>
            <h3 className="text-white text-xs font-semibold uppercase tracking-[0.15em] mb-5">
              {t('footer.aboutZara')}
            </h3>
            <ul className={`space-y-3 ${isArabic ? "text-base" : "text-sm"}`}>
              <li><Link href="/our-story" className="hover:text-white transition-colors">{t('footer.ourStory')}</Link></li>
              <li><a href="/press" className="hover:text-white transition-colors">{t('footer.press')}</a></li>
              <li><a href="/sustainability" className="hover:text-white transition-colors">{t('footer.sustainability')}</a></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-white text-xs font-semibold uppercase tracking-[0.15em] mb-5">
              {t('footer.contactHeader')}
            </h3>
            <ul className={`space-y-3 ${isArabic ? "text-base" : "text-sm"}`}>
              <li className="flex items-start gap-2">
                <span className="mt-0.5">📧</span>
                <a
                  href={`mailto:${t('footer.contactEmail')}`}
                  className="hover:text-white transition-colors"
                  dir="ltr"
                >
                  {t('footer.contactEmail')}
                </a>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-0.5">🕐</span>
                <span>{t('footer.contactHoursDays')}<br />{t('footer.contactHoursTime')}</span>
              </li>
            </ul>
          </div>

        </div>

        {/* ── Bottom bar ── */}
        <div className="mt-4 pt-6 pb-6 border-t border-[#2a2a2a] flex flex-col items-center">
          <p className="text-xs text-gray-500 text-center">
            {t('footer.copyright')} • {t('footer.madeInEgypt')}
          </p>
        </div>

      </div>
    </footer>
  );
}