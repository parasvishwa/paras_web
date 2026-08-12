import type { Metadata } from 'next';
import MarketPageClient from './_client';

export const metadata: Metadata = {
  title: 'Market | Gaubook',
  description: 'Shop gau products — ghee, panchgavya, organic goods, and more from verified gaushalas across India.',
};

export default function MarketPage() {
  return <MarketPageClient />;
}
