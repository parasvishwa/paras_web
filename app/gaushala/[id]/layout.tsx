import type { Metadata } from 'next';

const API_BASE = 'https://app.gaubook.org/api/v1';

async function fetchProfile(id: string) {
  try {
    const res = await fetch(`${API_BASE}/explore/gaushalas/${id}`, { next: { revalidate: 3600 } });
    if (!res.ok) return null;
    const json = await res.json();
    return json?.data ?? json ?? null;
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id: rawId } = await params;
  const UUID_RE = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  const uuidMatch = rawId.match(UUID_RE);
  const profileId = uuidMatch ? uuidMatch[0] : rawId;
  const raw = await fetchProfile(profileId);

  const name = raw?.businessName || raw?.gaushalaName || raw?.fullname || 'Gaubook Profile';
  const city = raw?.city || '';
  const state = raw?.state || '';
  const location = [city, state].filter(Boolean).join(', ');
  const rating = raw?.averageRating ?? raw?.rating;
  const gauVansh = raw?.totalGauVansh ?? raw?.gauVanshCount ?? 0;

  const description = [
    `${name} is a registered gaushala on Gaubook`,
    location && `located in ${location}`,
    rating && `with ${Number(rating).toFixed(1)}★ rating`,
    gauVansh && `caring for ${gauVansh} gau vansh`,
  ].filter(Boolean).join(', ') + '.';

  const title = location
    ? `${name} — ${location} | Gaushala on Gaubook`
    : `${name} | Gaushala on Gaubook`;

  const image = raw?.coverPhoto || raw?.profilePhoto || 'https://app.gaubook.org/og-default.jpg';
  const nameSlug = name.toLowerCase().replace(/[^\w\s-]/g, '').trim().replace(/[\s_]+/g, '-').replace(/-+/g, '-');
  const citySlug = location ? location.toLowerCase().replace(/[^\w\s-,]/g, '').trim().replace(/[\s_,]+/g, '-').replace(/-+/g, '-') : '';
  const slugParts = [nameSlug, citySlug].filter(Boolean).join('-');
  const slug = slugParts ? `${slugParts}-${profileId}` : profileId;
  const url = `https://app.gaubook.org/gaushala/${slug}`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url,
      siteName: 'Gaubook',
      images: [{ url: image, width: 1200, height: 630, alt: name }],
      type: 'profile',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [image],
    },
    alternates: { canonical: url },
  };
}

export default function GaushalaLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
