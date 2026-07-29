import type { Metadata } from 'next';

const API = 'https://app.gaubook.org/api/v1';

function resolveImg(url?: string | null): string | undefined {
  if (!url) return undefined;
  if (url.startsWith('http')) return url;
  if (url.startsWith('/')) return `https://app.gaubook.org${url}`;
  return url;
}

async function fetchProduct(id: string) {
  try {
    const res = await fetch(`${API}/products/${id}`, { next: { revalidate: 3600 } });
    if (!res.ok) return null;
    const json = await res.json();
    return json?.data ?? json;
  } catch {
    return null;
  }
}

type Props = { params: Promise<{ id: string }>; children: React.ReactNode };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const product = await fetchProduct(id);

  if (!product) {
    return {
      title: 'Product | Gaubook Market',
      description: 'Gau products and services on Gaubook Market.',
    };
  }

  const name: string = product.name ?? 'Gaubook Product';
  const price = product.discountPrice ?? product.price;
  const priceStr = price ? ` — ₹${Math.round(price)}` : '';
  const seller = product.user?.fullname ?? product.user?.businessName ?? '';
  const location = [product.user?.city, product.user?.state].filter(Boolean).join(', ');

  const description = product.description
    ? product.description.slice(0, 160)
    : `${name}${priceStr}${seller ? ` by ${seller}` : ''}${location ? ` in ${location}` : ''} · Gaubook Market`;

  const title = `${name} | Gaubook Market`;
  const image = resolveImg(product.imageUrl) ?? 'https://app.gaubook.org/logo-full.png';
  const pageUrl = `https://app.gaubook.org/market/${id}`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: pageUrl,
      siteName: 'Gaubook',
      type: 'article',
      images: [{ url: image, width: 800, height: 600, alt: name }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [image],
    },
  };
}

export default function MarketLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
