import type { Metadata } from 'next';
import './globals.css';
import Header from './components/Header';
import Footer from './components/Footer';
import { CurrencyProvider } from './context/CurrencyContext';
import { LanguageProvider } from './context/LanguageContext';
import CustomerChatbot from './components/CustomerChatbot';
import { Jost } from 'next/font/google';
import FirstOrderPopup from './components/FirstOrderPopup';

const organizationJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'GEORIANA',
  url: 'https://georiana.com',
  logo: 'https://georiana.com/images/logo.svg',
  sameAs: [
    'https://www.facebook.com/profile.php?id=61552738303653',
    'https://www.instagram.com/georiana_brand',
    'https://www.tiktok.com/@georiana_',
  ],
};

const websiteJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'GEORIANA',
  url: 'https://georiana.com',
  potentialAction: {
    '@type': 'SearchAction',
    target: {
      '@type': 'EntryPoint',
      urlTemplate: 'https://georiana.com/shop?search={search_term_string}',
    },
    'query-input': 'required name=search_term_string',
  },
};

const jost = Jost({
  subsets: ["cyrillic"],
  weight: ['100','200','300', '400', '500', '600'],
  variable: '--font-jost',
});


export const metadata: Metadata = {
  title: {
    default: 'GEORIANA — Modern Women\'s Fashion | Wear Intuitively',
    template: '%s | GEORIANA',
  },
  description: 'Shop natural fabrics and timeless pieces at GEORIANA. Modern women\'s fashion designed for the woman who wears life intuitively. Free shipping across Egypt.',
  keywords: ['GEORIANA', 'women fashion Egypt', 'online clothing store Egypt', 'modern womenswear'],
  openGraph: {
    title: 'GEORIANA — Modern Women\'s Fashion',
    description: 'Natural fabrics. Timeless pieces. Buy less, wear longer.',
    url: 'https://georiana.com',
    siteName: 'GEORIANA',
    images: ['/images/logo.svg'],
    locale: 'en_US',
    type: 'website',
  },
  metadataBase: new URL('https://georiana.com'),
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,100..300&display=swap"
          rel="stylesheet"
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
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