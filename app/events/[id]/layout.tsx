import type { Metadata } from 'next';

const API = 'https://app.gaubook.org/api/v1';

function resolveImg(url?: string | null): string | undefined {
  if (!url) return undefined;
  if (url.startsWith('http')) return url;
  if (url.startsWith('/')) return `https://app.gaubook.org${url}`;
  return url;
}

async function fetchEvent(id: string) {
  try {
    const res = await fetch(`${API}/events/${id}`, { next: { revalidate: 3600 } });
    if (!res.ok) return null;
    const json = await res.json();
    return json?.data?.event ?? json?.data ?? json;
  } catch {
    return null;
  }
}

type Props = { params: Promise<{ id: string }>; children: React.ReactNode };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const event = await fetchEvent(id);

  if (!event) {
    return {
      title: 'Event | Gaubook',
      description: 'Gau seva events across India — on Gaubook.',
    };
  }

  const title = `${event.title} | Gaubook`;
  const location = [event.city, event.state].filter(Boolean).join(', ');
  const dateStr = event.startDate
    ? new Date(event.startDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
    : '';
  const description = event.description
    ? event.description.slice(0, 160)
    : `${event.title}${location ? ` in ${location}` : ''}${dateStr ? ` — ${dateStr}` : ''} · Gaubook Events`;

  const image = resolveImg(event.coverImage) ?? 'https://app.gaubook.org/logo-full.png';
  const pageUrl = `https://app.gaubook.org/events/${id}`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: pageUrl,
      siteName: 'Gaubook',
      type: 'article',
      images: [{ url: image, width: 1200, height: 630, alt: event.title }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [image],
    },
  };
}

export default function EventLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
