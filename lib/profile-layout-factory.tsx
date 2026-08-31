import React from 'react';

const API_BASE = 'https://app.gaubook.org/api/v1';
const SITE = 'https://www.gaubook.org';
const UUID_RE = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function resolveImg(url?: string | null): string | undefined {
  if (!url) return undefined;
  if (url.startsWith('http')) return url;
  if (url.startsWith('/')) return `https://app.gaubook.org${url}`;
  return url;
}

function makeSlug(name: string, city: string, state: string, id: string): string {
  const nameSlug = (name || '').toLowerCase().replace(/[^\w\s-]/g, '').trim().replace(/[\s_]+/g, '-').replace(/-+/g, '-');
  const location = [city, state].filter(Boolean).join(', ');
  const locSlug = location
    ? location.toLowerCase().replace(/[^\w\s-]/g, '').replace(/[\s,]+/g, '-').replace(/-+/g, '-')
    : '';
  const parts = [nameSlug, locSlug].filter(Boolean).join('-');
  return parts ? `${parts}-${id}` : id;
}

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

export type RoutePrefix = 'gaushala' | 'vendor' | 'expert';

export function createProfileLayout(routePrefix: RoutePrefix) {
  return async function ProfileLayout({
    children,
    params,
  }: {
    children: React.ReactNode;
    params: Promise<{ id: string }>;
  }) {
    const { id: rawId } = await params;
    const uuidMatch = rawId.match(UUID_RE);
    const profileId = uuidMatch ? uuidMatch[0] : rawId;
    const raw = await fetchProfile(profileId);

    let jsonLd: Record<string, unknown> | null = null;

    if (raw) {
      const roleRaw = raw.role;
      const role: string = Array.isArray(roleRaw)
        ? ((roleRaw as string[])[0] ?? 'Gaushala')
        : ((roleRaw as string) ?? 'Gaushala');

      const sub = ((role === 'Vendor'
        ? (raw.vendorProfile as Record<string, unknown>)
        : (raw.gaushala as Record<string, unknown>)) ?? {}) as Record<string, unknown>;

      const name = ((sub.gaushalaName ?? sub.businessName ?? raw.fullname ?? '') as string);
      const city = ((sub.villageTown ?? sub.city ?? raw.city ?? '') as string);
      const state = ((sub.state ?? raw.state ?? '') as string);
      const photo = resolveImg((sub.profilePhoto ?? raw.profilePhoto) as string | undefined);
      const description = (sub.bioDescription ?? sub.businessDescription ?? raw.description ?? undefined) as string | undefined;
      const rating = raw.averageRating ?? raw.avgRating;
      const reviewCount = raw.reviewCount ?? 0;
      const lat = raw.latitude as number | undefined;
      const lng = raw.longitude as number | undefined;

      const slug = makeSlug(name, city, state, profileId);
      const pageUrl = `${SITE}/${routePrefix}/${slug}`;

      const schemaType =
        role === 'NGO' ? 'NGO'
        : role === 'Vendor' ? 'Store'
        : role === 'Expert' ? 'Person'
        : 'LocalBusiness';

      jsonLd = {
        '@context': 'https://schema.org',
        '@type': schemaType,
        name,
        url: pageUrl,
        ...(photo ? { image: photo } : {}),
        ...(description ? { description } : {}),
        ...((city || state) ? {
          address: {
            '@type': 'PostalAddress',
            ...(city ? { addressLocality: city } : {}),
            ...(state ? { addressRegion: state } : {}),
            addressCountry: 'IN',
          },
        } : {}),
        ...((lat && lng) ? {
          geo: {
            '@type': 'GeoCoordinates',
            latitude: lat,
            longitude: lng,
          },
        } : {}),
        ...((rating && Number(rating) > 0 && Number(reviewCount) > 0) ? {
          aggregateRating: {
            '@type': 'AggregateRating',
            ratingValue: Number(rating).toFixed(1),
            reviewCount: Number(reviewCount),
            bestRating: 5,
            worstRating: 1,
          },
        } : {}),
      };

      // Organisation-level additions
      if (schemaType === 'LocalBusiness' || schemaType === 'NGO' || schemaType === 'Store') {
        const phone = raw.phone ?? raw.mobile ?? sub.phone;
        if (phone) jsonLd.telephone = phone as string;
        jsonLd.foundingLocation = { '@type': 'Place', address: jsonLd.address };
        jsonLd.knowsAbout = 'Cow protection, Gau Seva, Gaushala management';
      }
    }

    return (
      <>
        {jsonLd && (
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
          />
        )}
        {children}
      </>
    );
  };
}
