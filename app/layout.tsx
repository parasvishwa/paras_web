import type { Metadata } from 'next';
import { Poppins } from 'next/font/google';
import './globals.css';
import Navbar from '@/components/layout/Navbar';
import SplashScreen from '@/components/SplashScreen';
import { Toaster } from 'react-hot-toast';
import { I18nProvider } from '@/lib/i18n/I18nContext';

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: "Gaubook — India's Largest Gau Community",
  description: "Connect with gaushalas, buy gau products, report rescue alerts and join India's largest cow protection community.",
  openGraph: {
    title: 'Gaubook',
    description: "India's Largest Gau Community",
    images: ['/og-image.png'],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={poppins.className} suppressHydrationWarning>
        <I18nProvider>
          <SplashScreen />
          <Navbar />
          <main className="min-h-screen">{children}</main>
          <Toaster
          position="top-center"
          toastOptions={{
            style: {
              background: '#fff',
              color: '#000',
              border: '1px solid #EFE7DC',
              borderRadius: '12px',
              fontWeight: 500,
            },
          }}
        />
        </I18nProvider>
      </body>
    </html>
  );
}
