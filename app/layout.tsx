import type { Metadata } from 'next';
import './globals.css';
import Header from './components/Header';
import Footer from './components/Footer';
import { CurrencyProvider } from './context/CurrencyContext';
import { LanguageProvider } from './context/LanguageContext';

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
    <html lang="en">
      <body>
        <LanguageProvider>
          <CurrencyProvider>
            <Header />
            {children}
            <Footer />
          </CurrencyProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}