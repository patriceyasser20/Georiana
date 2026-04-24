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
      <body suppressHydrationWarning>
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