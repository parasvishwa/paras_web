import type { MetadataRoute } from 'next';

const API = 'https://app.gaubook.org/api/v1';
const SITE = 'https://www.gaubook.org';
const LIMIT = 100;

function makeSlug(name: string, city: string, state: string, id: string): string {
  const nameSlug = (name || '').toLowerCase().replace(/[^\w\s-]/g, '').trim().replace(/[\s_]+/g, '-').replace(/-+/g, '-');
  const location = [city, state].filter(Boolean).join(', ');
  const locSlug = location
    ? location.toLowerCase().replace(/[^\w\s-]/g, '').replace(/[\s,]+/g, '-').replace(/-+/g, '-')
    : '';
  const parts = [nameSlug, locSlug].filter(Boolean).join('-');
  return parts ? `${parts}-${id}` : id;
}

interface ProfileRow {
  id: string;
  name: string;
  businessName?: string;
  fullname?: string;
  villageTown?: string;
  city?: string;
  state?: string;
}

async function fetchAllProfiles(role: string): Promise<ProfileRow[]> {
  const results: ProfileRow[] = [];
  let page = 1;
  while (true) {
    try {
      const res = await fetch(
        `${API}/explore/gaushalas?role=${encodeURIComponent(role)}&page=${page}&limit=${LIMIT}`,
        { next: { revalidate: 86400 } }
      );
      if (!res.ok) break;
      const json = await res.json();
      const items: ProfileRow[] = json?.data?.gaushalas ?? [];
      if (!items.length) break;
      results.push(...items);
      const total: number = json?.data?.total ?? 0;
      if (results.length >= total) break;
      page++;
    } catch {
      break;
    }
  }
  return results;
}

interface ProductRow { id: string }

async function fetchAllProducts(): Promise<ProductRow[]> {
  const results: ProductRow[] = [];
  let page = 1;
  while (true) {
    try {
      const res = await fetch(`${API}/products?page=${page}&limit=${LIMIT}`, {
        next: { revalidate: 86400 },
      });
      if (!res.ok) break;
      const json = await res.json();
      const items: ProductRow[] = json?.data ?? [];
      if (!items.length) break;
      results.push(...items);
      if (items.length < LIMIT) break;
      page++;
    } catch {
      break;
    }
  }
  return results;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [gaushalas, ngos, vendors, experts, products] = await Promise.all([
    fetchAllProfiles('Gaushala'),
    fetchAllProfiles('NGO'),
    fetchAllProfiles('Vendor'),
    fetchAllProfiles('Expert'),
    fetchAllProducts(),
  ]);

  const now = new Date();

  function profileSlug(p: ProfileRow) {
    const name = p.name ?? p.businessName ?? p.fullname ?? '';
    const city = p.villageTown ?? p.city ?? '';
    const state = p.state ?? '';
    return makeSlug(name, city, state, p.id);
  }

  return [
    // ── Static pages ───────────────────────────────────────────────────────────
    { url: SITE,                  lastModified: now, changeFrequency: 'daily',  priority: 1.0 },
    { url: `${SITE}/explore`,     lastModified: now, changeFrequency: 'hourly', priority: 0.9 },
    { url: `${SITE}/market`,      lastModified: now, changeFrequency: 'daily',  priority: 0.8 },
    { url: `${SITE}/expert`,      lastModified: now, changeFrequency: 'daily',  priority: 0.8 },
    { url: `${SITE}/rescue`,      lastModified: now, changeFrequency: 'hourly', priority: 0.7 },

    // ── Gaushala profiles (/gaushala/[slug]) ──────────────────────────────────
    ...gaushalas.map(g => ({
      url: `${SITE}/gaushala/${profileSlug(g)}`,
      lastModified: now,
      changeFrequency: 'weekly' as const,
      priority: 0.85,
    })),

    // ── NGO profiles (also /gaushala/ route) ─────────────────────────────────
    ...ngos.map(n => ({
      url: `${SITE}/gaushala/${profileSlug(n)}`,
      lastModified: now,
      changeFrequency: 'weekly' as const,
      priority: 0.75,
    })),

    // ── Vendor profiles (/vendor/[slug]) ──────────────────────────────────────
    ...vendors.map(v => ({
      url: `${SITE}/vendor/${profileSlug(v)}`,
      lastModified: now,
      changeFrequency: 'weekly' as const,
      priority: 0.75,
    })),

    // ── Expert profiles (/expert/[slug]) ──────────────────────────────────────
    ...experts.map(e => ({
      url: `${SITE}/expert/${profileSlug(e)}`,
      lastModified: now,
      changeFrequency: 'weekly' as const,
      priority: 0.75,
    })),

    // ── Products (/market/[id]) ───────────────────────────────────────────────
    ...products.map(p => ({
      url: `${SITE}/market/${p.id}`,
      lastModified: now,
      changeFrequency: 'daily' as const,
      priority: 0.65,
    })),
  ];
}
