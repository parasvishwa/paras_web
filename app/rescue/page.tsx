import type { Metadata } from 'next';
import RescuePageClient from './_client';

export const metadata: Metadata = {
  title: 'Rescue | Gaubook',
  description: 'Report and track cow rescue alerts across India. Help injured, stray, and abandoned cows in your area.',
};

export default function RescuePage() {
  return <RescuePageClient />;
}
