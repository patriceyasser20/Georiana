'use client';

import { FaWhatsapp } from 'react-icons/fa';
import { useTranslation } from '../context/LanguageContext';

const WHATSAPP_NUMBER = '201096963387'; // same number used in Footer.tsx



export default function WhatsAppWidget() {
  const href = `https://wa.me/${WHATSAPP_NUMBER}?`;
  const { t } = useTranslation();

  return (
    <>
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Chat with us on WhatsApp"
        className="whatsapp-widget fixed bottom-6 end-6 z-[90] flex items-center gap-3 group"
      >
        {/* "Need help?" box — hidden until hover */}
        <span className="bg-[#1a1a1a] text-white text-sm font-medium px-5 py-3 rounded-full shadow-lg whitespace-nowrap opacity-0 translate-x-2 pointer-events-none group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200">
          {t('whatsapp.needHelp')}
        </span>

        {/* Green circular WhatsApp button — vibrates until hovered */}
        <span className="whatsapp-icon w-16 h-16 shrink-0 bg-[#25D366] rounded-full shadow-xl flex items-center justify-center">
          <FaWhatsapp size={37} className="text-white" />
        </span>
      </a>

      <style jsx>{`
        @keyframes whatsapp-vibrate {
          0%, 100% { transform: translateY(0); }
          25% { transform: translateY(-12px); }
          50% { transform: translateY(0); }
          75% { transform: translateY(-6px); }
        }

        .whatsapp-icon {
          animation: whatsapp-vibrate 0.5s ease-in-out infinite;
        }

        .whatsapp-widget:hover .whatsapp-icon {
          animation-play-state: paused;
          transform: translateY(0);
        }
      `}</style>
    </>
  );
}