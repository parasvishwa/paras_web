import type { Metadata } from 'next';

const API = 'https://app.gaubook.org/api/v1';

function resolveImg(url?: string | null): string | undefined {
  if (!url) return undefined;
  if (url.startsWith('http')) return url;
  if (url.startsWith('/')) return `https://app.gaubook.org${url}`;
  return url;
}

async function fetchPost(id: string) {
  try {
    const res = await fetch(`${API}/posts/${id}`, { next: { revalidate: 3600 } });
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
  const post = await fetchPost(id);

  if (!post) {
    return {
      title: 'Post | Gaubook',
      description: 'See this post on Gaubook — India\'s largest Gau community.',
    };
  }

  const authorName: string = post.user?.fullname ?? post.authorName ?? 'Gaubook';
  const rawText: string = post.title ?? post.content ?? post.description ?? '';
  const title = rawText
    ? `${rawText.slice(0, 60)}${rawText.length > 60 ? '…' : ''} | Gaubook`
    : `${authorName} on Gaubook`;
  const description = rawText
    ? rawText.slice(0, 160)
    : `${authorName} shared this on Gaubook — India's largest Gau community.`;

  const imageUrl = resolveImg(post.imageUrl ?? post.image ?? (Array.isArray(post.images) ? post.images[0] : null));
  const image = imageUrl ?? 'https://app.gaubook.org/logo-full.png';
  const pageUrl = `https://app.gaubook.org/post/${id}`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: pageUrl,
      siteName: 'Gaubook',
      type: 'article',
      images: [{ url: image, width: 1200, height: 630, alt: rawText.slice(0, 80) || 'Gaubook Post' }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [image],
    },
  };
}

export default function PostLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
