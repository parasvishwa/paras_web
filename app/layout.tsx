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
  metadataBase: new URL('https://www.gaubook.org'),
  title: {
    default: "Gaubook — India's Largest Gau Community",
    template: '%s | Gaubook',
  },
  description:
    "Gaubook — India's largest platform to connect with gaushalas, buy authentic gau products, report rescue alerts, and join the cow protection community. Find gaushalas near you across India.",
  keywords: [
    'gaushala', 'gau seva', 'cow protection', 'gau vansh', 'Indian cow',
    'gaushala near me', 'desi cow products', 'panchgavya', 'cow rescue',
    'gaubook', 'gau samrakshan', 'go seva', 'A2 milk', 'desi ghee',
    'gaushala directory', 'cow shelter India',
  ],
  authors: [{ name: 'Gaubook', url: 'https://www.gaubook.org' }],
  creator: 'Gaubook',
  publisher: 'Gaubook',
  openGraph: {
    type: 'website',
    locale: 'en_IN',
    url: 'https://www.gaubook.org',
    siteName: 'Gaubook',
    title: "Gaubook — India's Largest Gau Community",
    description:
      "India's largest platform to connect with gaushalas, buy authentic gau products, and join the cow protection community.",
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Gaubook — India\'s Largest Gau Community',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    site: '@gaubookapp',
    creator: '@gaubookapp',
    title: "Gaubook — India's Largest Gau Community",
    description: "India's largest gau seva platform — gaushalas, products, rescue alerts.",
    images: ['/og-image.png'],
  },
  alternates: { canonical: 'https://www.gaubook.org' },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-image-preview': 'large', 'max-snippet': -1 },
  },
};

const websiteJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'Gaubook',
  url: 'https://www.gaubook.org',
  description: "India's largest gau seva platform — find gaushalas, buy gau products, report cow rescues.",
  potentialAction: {
    '@type': 'SearchAction',
    target: {
      '@type': 'EntryPoint',
      urlTemplate: 'https://www.gaubook.org/explore?search={search_term_string}',
    },
    'query-input': 'required name=search_term_string',
  },
};

const orgJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'Gaubook',
  url: 'https://www.gaubook.org',
  logo: 'https://www.gaubook.org/og-image.png',
  sameAs: [
    'https://www.instagram.com/gaubookapp',
    'https://www.facebook.com/share/1LEDgpHdLe/',
    'https://youtube.com/@gaubookapp',
    'https://whatsapp.com/channel/0029VbCTT5uD8SDu2yYN5L1L',
  ],
  contactPoint: {
    '@type': 'ContactPoint',
    telephone: '+91-7620886988',
    contactType: 'customer service',
    availableLanguage: ['English', 'Hindi', 'Gujarati', 'Marathi'],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJsonLd) }}
        />
      </head>
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
