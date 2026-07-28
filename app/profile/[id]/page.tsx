import type { Metadata } from 'next';
import { generateUserMetadata } from '@/lib/profile-metadata';
import ProfileDetailClientPage from '@/app/gaushala/[id]/_client';

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  return generateUserMetadata(id);
}

export default async function PublicProfilePage() {
  return <ProfileDetailClientPage />;
}
