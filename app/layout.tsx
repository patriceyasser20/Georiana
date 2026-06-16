import type { Metadata } from 'next';
import './globals.css';
import Header from './components/Header';
import Footer from './components/Footer';
import { CurrencyProvider } from './context/CurrencyContext';
import { LanguageProvider } from './context/LanguageContext';
import CustomerChatbot from './components/CustomerChatbot';

export const metadata: Metadata = {
  title: 'GEORIANA',
  description: 'Modern Fashion Store',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning className="bg-white min-h-screen">
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
            <Footer />
            {/* <CustomerChatbot /> */}
          </CurrencyProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}