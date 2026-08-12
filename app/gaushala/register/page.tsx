import type { Metadata } from 'next';
import GaushalaRegisterPageClient from './_client';

export const metadata: Metadata = {
  title: 'Register Your Gaushala | Gaubook',
  description: 'Register your gaushala on Gaubook to connect with the gau seva community, accept donations, and showcase your work.',
};

export default function GaushalaRegisterPage() {
  return <GaushalaRegisterPageClient />;
}
