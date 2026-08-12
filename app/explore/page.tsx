import type { Metadata } from 'next';
import ExplorePageClient from './_client';

export const metadata: Metadata = {
  title: 'Explore | Gaubook',
  description: 'Discover gaushalas, vendors, experts, and NGOs working for cow welfare across India.',
};

export default function ExplorePage() {
  return <ExplorePageClient />;
}
