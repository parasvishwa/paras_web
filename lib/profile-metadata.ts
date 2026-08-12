import type { Metadata } from 'next';

const BACKEND = process.env.NEXT_PUBLIC_API_URL ?? 'https://app.gaubook.org';
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://gaubook.org';
const API = `${BACKEND}/api/v1`;

function resolveImg(url?: string | null): string | undefined {
  if (!url) return undefined;
  if (url.startsWith('http')) return url;
  if (url.startsWith('/')) return `${BACKEND}${url}`;
  return url;
}

function resolveCover(raw: unknown): string | undefined {
  if (Array.isArray(raw)) {
    return (raw as string[]).map((u) => resolveImg(u)).find((u) => !!u);
  }
  return resolveImg(raw as string | null);
}

async function fetchProfile(id: string) {
  try {
    const res = await fetch(`${API}/explore/gaushalas/${id}`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) return null;
    const json = await res.json();
    return json?.data || json;
  } catch {
    return null;
  }
}

export async function generateUserMetadata(id: string): Promise<Metadata> {
  const base = await generateProfileMetadata(id);
  if (base.openGraph && typeof base.openGraph === 'object') {
    (base.openGraph as Record<string, unknown>).url = `${SITE_URL}/profile/${id}`;
  }
  return base;
}

export async function generateProfileMetadata(id: string): Promise<Metadata> {
  const raw = await fetchProfile(id);
  if (!raw) {
    return {
      title: 'Gaubook — India\'s Largest Gau Community',
      description: 'Connect with Gaushalas, NGOs, Vendors and Experts across India.',
    };
  }

  const role: string = Array.isArray(raw.role) ? (raw.role[0] ?? 'Gaushala') : (raw.role ?? 'Gaushala');

  // Vendor fields come nested under vendorProfile
  const vp = raw.vendorProfile;
  const gp = raw.gaushalaProfile || raw.gaushala;

  const name: string =
    vp?.businessName || gp?.businessName || raw.businessName || raw.fullname || 'Gaubook Profile';

  const city: string = vp?.city || gp?.city || raw.city || '';
  const state: string = vp?.state || gp?.state || raw.state || '';
  const location = [city, state].filter(Boolean).join(', ');

  const bio: string =
    vp?.businessDescription || gp?.description || raw.description || '';

  const description = bio
    ? bio.slice(0, 160)
    : `${role}${location ? ` in ${location}` : ''} — on Gaubook, India's largest Gau community.`;

  const rawPhoto =
    vp?.profilePhoto || gp?.profilePhoto || raw.profilePhoto;
  const rawCover =
    vp?.coverPhoto || gp?.coverPhoto || raw.coverPhoto;

  const image = resolveImg(rawPhoto) || resolveCover(rawCover);

  const pageUrl = `${SITE_URL}/gaushala/${id}`;

  return {
    title: `${name} | Gaubook`,
    description,
    openGraph: {
      title: `${name} | Gaubook`,
      description,
      url: pageUrl,
      siteName: 'Gaubook',
      type: 'profile',
      images: image
        ? [{ url: image, width: 800, height: 600, alt: name }]
        : [{ url: 'https://app.gaubook.org/logo-full.png', width: 400, height: 400, alt: 'Gaubook' }],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${name} | Gaubook`,
      description,
      images: image ? [image] : ['https://app.gaubook.org/logo-full.png'],
    },
  };
}
