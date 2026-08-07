import type { Metadata } from 'next';
import { headers } from 'next/headers';
import './globals.css';
import Header from './components/Header';
import Footer from './components/Footer';
import { CurrencyProvider } from './context/CurrencyContext';
import { LanguageProvider } from './context/LanguageContext';
import CustomerChatbot from './components/CustomerChatbot';
import { Jost } from 'next/font/google';
import FirstOrderPopup from './components/FirstOrderPopup';

const jost = Jost({
  subsets: ["cyrillic"],
  weight: ['100','200','300', '400', '500', '600'],
  variable: '--font-jost',
});

const SITE = 'https://georiana.com';

export async function generateMetadata(): Promise<Metadata> {
  const headersList = await headers();
  const pathname = headersList.get('x-pathname') || '/';
  const canonical = pathname === '/' ? SITE : `${SITE}${pathname}`;
  const arUrl = pathname === '/' ? `${SITE}/ar` : `${SITE}/ar${pathname}`;

  return {
    title: {
      default: 'GEORIANA — Modern Women\'s Fashion | Wear Intuitively',
      template: '%s | GEORIANA',
    },
    description: 'Shop natural fabrics and timeless pieces at GEORIANA. Modern women\'s fashion designed for the woman who wears life intuitively. Free shipping across Egypt.',
    keywords: ['GEORIANA', 'women fashion Egypt', 'online clothing store Egypt', 'modern womenswear'],
    openGraph: {
      title: 'GEORIANA — Modern Women\'s Fashion',
      description: 'Natural fabrics. Timeless pieces. Buy less, wear longer.',
      url: SITE,
      siteName: 'GEORIANA',
      images: ['/images/logo.svg'],
      locale: 'en_US',
      type: 'website',
    },
    metadataBase: new URL(SITE),
    alternates: {
      canonical,
      languages: { en: canonical, ar: arUrl },
    },
  };
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const headersList = await headers();
  const locale = (headersList.get('x-locale') as 'en' | 'ar') || 'en';
  const dir = locale === 'ar' ? 'rtl' : 'ltr';

  return (
    <html lang={locale} dir={dir} suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,100..300&display=swap"
          rel="stylesheet"
        />
      </head>
      <body suppressHydrationWarning className={`${jost.variable} font-sans bg-white min-h-screen`}>
        <script dangerouslySetInnerHTML={{ __html: `
          try {
            const TWO_HOURS = 2 * 60 * 60 * 1000;
            const timestamp = localStorage.getItem('reviewOrderTimestamp');
            if (timestamp && Date.now() - Number(timestamp) > TWO_HOURS) {
              localStorage.removeItem('reviewOrder');
              localStorage.removeItem('reviewOrderTimestamp');
              localStorage.removeItem('pendingOrderId');
            }
          } catch(e) {}

          try {
            const version = '1';
            if (localStorage.getItem('cacheVersion') !== version) {
              localStorage.removeItem('reviewOrder');
              localStorage.removeItem('reviewOrderTimestamp');
              localStorage.removeItem('pendingOrderId');
              localStorage.setItem('cacheVersion', version);
            }
          } catch(e) {}
        `}} />
        {/* <LanguageProvider initialLocale={locale}> */}
          <LanguageProvider>
          <CurrencyProvider>
            <Header />
            {children}
            <FirstOrderPopup />
            <Footer />
            {/* <CustomerChatbot /> */}
          </CurrencyProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}