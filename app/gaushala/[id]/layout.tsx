import type { Metadata } from 'next';

const API_BASE = 'https://app.gaubook.org/api/v1';
const UUID_RE = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function fetchProfile(id: string) {
  try {
    const res = await fetch(`${API_BASE}/explore/gaushalas/${id}`, { next: { revalidate: 3600 } });
    if (!res.ok) return null;
    const json = await res.json();
    return (json?.data ?? json ?? null) as Record<string, unknown> | null;
  } catch {
    return null;
  }
}

function resolveImg(url?: string | null): string | undefined {
  if (!url) return undefined;
  if ((url as string).startsWith('http')) return url as string;
  if ((url as string).startsWith('/')) return `https://app.gaubook.org${url}`;
  return url as string;
}

export async function generateMetadata(
  { params }: { params: Promise<{ id: string }> }
): Promise<Metadata> {
  const { id: rawId } = await params;
  const uuidMatch = rawId.match(UUID_RE);
  const profileId = uuidMatch ? uuidMatch[0] : rawId;
  const raw = await fetchProfile(profileId);

  if (!raw) {
    return { title: 'Profile | Gaubook' };
  }

  // Determine role
  const roleRaw = raw.role;
  const role: string = Array.isArray(roleRaw)
    ? ((roleRaw as string[])[0] ?? 'Gaushala')
    : ((roleRaw as string) ?? 'Gaushala');

  // Pick the sub-profile that holds the real data
  const sub = (role === 'Vendor'
    ? (raw.vendorProfile as Record<string, unknown>)
    : (raw.gaushala as Record<string, unknown>)) ?? {};

  const name = (
    sub.gaushalaName ?? sub.businessName ?? raw.fullname ?? 'Gaubook Profile'
  ) as string;

  const city = (sub.villageTown ?? sub.city ?? raw.city ?? '') as string;
  const state = (sub.state ?? raw.state ?? '') as string;
  const location = [city, state].filter(Boolean).join(', ');

  const rating = raw.averageRating ?? raw.avgRating;
  const gauVansh = (sub.totalCowCapacity ?? raw.gauVanshCount ?? 0) as number;

  const rawDesc = (sub.bioDescription ?? sub.businessDescription ?? raw.description ?? '') as string;
  const descParts = [
    rawDesc || `${name} is on Gaubook`,
    location && `located in ${location}`,
    rating && `with ${Number(rating).toFixed(1)} rating`,
    gauVansh > 0 && role === 'Gaushala' && `caring for ${gauVansh} gau vansh`,
  ].filter(Boolean);
  const description = descParts.join(', ').replace(/,$/, '') + '.';

  const roleLabel = role === 'Gaushala' ? 'Gaushala' : role === 'Vendor' ? 'Vendor' : role === 'NGO' ? 'NGO' : 'Expert';
  const title = location
    ? `${name} - ${location} | ${roleLabel} on Gaubook`
    : `${name} | ${roleLabel} on Gaubook`;

  const coverRaw = sub.coverPhoto ?? raw.coverPhoto;
  const cover = Array.isArray(coverRaw) ? (coverRaw as string[])[0] : (coverRaw as string | undefined);
  const photo = (sub.profilePhoto ?? raw.profilePhoto) as string | undefined;
  const image = resolveImg(cover) ?? resolveImg(photo) ?? 'https://app.gaubook.org/og-default.jpg';

  const nameSlug = name.toLowerCase().replace(/[^\w\s-]/g, '').trim().replace(/[\s_]+/g, '-').replace(/-+/g, '-');
  const locSlug = location ? location.toLowerCase().replace(/[^\w\s-]/g, '').replace(/[\s,]+/g, '-').replace(/-+/g, '-') : '';
  const slugParts = [nameSlug, locSlug].filter(Boolean).join('-');
  const slug = slugParts ? `${slugParts}-${profileId}` : profileId;
  const url = `https://www.gaubook.org/gaushala/${slug}`;

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
