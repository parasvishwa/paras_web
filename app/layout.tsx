import type { Metadata } from 'next';
import './globals.css';
import Navbar from '@/components/layout/Navbar';
import SplashScreen from '@/components/SplashScreen';
import { Toaster } from 'react-hot-toast';

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
      <body>
        <SplashScreen />
        <Navbar />
        <main className="min-h-screen">{children}</main>
        <Toaster
          position="top-center"
          toastOptions={{
            style: {
              background: '#fff',
              color: '#2D1B0E',
              border: '1px solid #E8DDD0',
              borderRadius: '12px',
              fontWeight: 500,
            },
          }}
        />
      </body>
    </html>
  );
}
