'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Heart, MessageCircle, Eye, Share2, Check, Copy } from 'lucide-react';
import { feedApi } from '@/lib/api';
import { AppGateModal } from '@/components/AppGate';
import { isLoggedIn } from '@/lib/auth';

const BACKEND = 'https://app.gaubook.org';

function resolveImg(url?: string | null): string | undefined {
  if (!url) return undefined;
  if (url.startsWith('http')) return url;
  if (url.startsWith('/')) return `${BACKEND}${url}`;
  return url;
}

interface PostAuthor {
  id: string;
  fullname: string;
  role?: string | string[];
  profilePhoto?: string;
  gaushala?: { profilePhoto?: string; gaushalaName?: string };
  ngo?: { profilePhoto?: string };
  vendorProfile?: { profilePhoto?: string };
  appUserProfile?: { profilePhoto?: string };
}

interface PostData {
  id: string;
  title?: string;
  content?: string;
  description?: string;
  imageUrl?: string;
  images?: string[];
  postType?: string;
  category?: string;
  urgency?: string;
  likeCount?: number;
  commentCount?: number;
  viewCount?: number;
  createdAt?: string;
  user?: PostAuthor;
}

function getAuthorPhoto(user?: PostAuthor): string | undefined {
  return user?.gaushala?.profilePhoto ?? user?.ngo?.profilePhoto ??
    user?.vendorProfile?.profilePhoto ?? user?.appUserProfile?.profilePhoto ?? undefined;
}

function getAuthorName(user?: PostAuthor): string {
  return user?.gaushala?.gaushalaName ?? user?.fullname ?? 'Gaubook';
}

function formatRelative(iso?: string): string {
  if (!iso) return '';
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export default function PostDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [post, setPost] = useState<PostData | null>(null);
  const [loading, setLoading] = useState(true);
  const [appGate, setAppGate] = useState(false);
  const [copied, setCopied] = useState(false);
  const loggedIn = isLoggedIn();

  useEffect(() => {
    if (!id) return;
    feedApi.getPostById(id)
      .then((res) => {
        const raw = res.data?.data ?? res.data;
        if (raw?.id) setPost(raw);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  const handleShare = async () => {
    const url = window.location.href;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      if (navigator.share) navigator.share({ url });
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--canvas)' }}>
        <div style={{ width: 32, height: 32, borderRadius: '50%', border: '3px solid var(--border)', borderTopColor: 'var(--primary)', animation: 'spin 0.7s linear infinite' }} />
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    );
  }

  if (!post) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, background: 'var(--canvas)' }}>
        <p style={{ fontSize: 18, fontWeight: 700, color: 'var(--text)' }}>Post not found</p>
        <Link href="/" style={{ color: 'var(--primary)', fontWeight: 600, fontSize: 14 }}>← Back to Feed</Link>
      </div>
    );
  }

  const authorName = getAuthorName(post.user);
  const authorPhoto = getAuthorPhoto(post.user);
  const authorRole = Array.isArray(post.user?.role) ? post.user.role[0] : post.user?.role ?? '';
  const text = post.title ?? post.content ?? post.description ?? '';
  const images: string[] = [
    ...(post.imageUrl ? [post.imageUrl] : []),
    ...(Array.isArray(post.images) ? post.images : []),
  ].filter((v, i, a) => a.indexOf(v) === i).map(u => resolveImg(u)!).filter(Boolean);

  return (
    <div style={{ background: 'var(--canvas)', minHeight: '100vh', paddingBottom: 80 }}>
      {appGate && <AppGateModal feature="full post interaction" onClose={() => setAppGate(false)} />}

      {/* Top bar */}
      <div style={{ position: 'sticky', top: 0, zIndex: 40, background: 'var(--canvas)', borderBottom: '1px solid var(--border)', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <button onClick={() => router.back()} style={{ padding: 8, borderRadius: 8, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text)', display: 'flex', alignItems: 'center' }}>
          <ArrowLeft size={20} />
        </button>
        <span style={{ fontWeight: 700, fontSize: 16, color: 'var(--text)', flex: 1 }}>Post</span>
        <button onClick={handleShare} style={{ padding: 8, borderRadius: 8, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 6 }}>
          {copied ? <Check size={18} color="var(--primary)" /> : <Share2 size={18} />}
        </button>
      </div>

      <div style={{ maxWidth: 640, margin: '0 auto', padding: '0 0 16px' }}>
        {/* Author row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 16px 10px' }}>
          <Link href={`/gaushala/${post.user?.id}`} style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 42, height: 42, borderRadius: '50%', overflow: 'hidden', background: 'var(--primary-tint, #f0faf5)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1.5px solid var(--border)' }}>
              {authorPhoto
                ? <img src={resolveImg(authorPhoto)} alt={authorName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : <span style={{ fontWeight: 700, fontSize: 16, color: 'var(--primary)' }}>{authorName[0]?.toUpperCase()}</span>}
            </div>
            <div>
              <p style={{ fontWeight: 700, fontSize: 14, color: 'var(--text)', margin: 0 }}>{authorName}</p>
              {authorRole && <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: 0 }}>{authorRole}</p>}
            </div>
          </Link>
          <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--text-muted)' }}>{formatRelative(post.createdAt)}</span>
        </div>

        {/* Post text */}
        {text && (
          <div style={{ padding: '0 16px 12px' }}>
            <p style={{ fontSize: 15, color: 'var(--text)', lineHeight: 1.65, whiteSpace: 'pre-wrap', margin: 0 }}>{text}</p>
          </div>
        )}

        {/* Images */}
        {images.length > 0 && (
          <div style={{ background: '#000', maxHeight: 420, overflow: 'hidden' }}>
            <img
              src={images[0]}
              alt="Post image"
              style={{ width: '100%', maxHeight: 420, objectFit: 'contain', display: 'block' }}
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
            />
          </div>
        )}

        {/* Stats row */}
        <div style={{ display: 'flex', gap: 20, padding: '12px 16px', borderBottom: '1px solid var(--border)' }}>
          <button onClick={() => loggedIn ? undefined : setAppGate(true)} style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: 13, fontWeight: 600 }}>
            <Heart size={17} /> {post.likeCount ?? 0}
          </button>
          <button onClick={() => setAppGate(true)} style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: 13, fontWeight: 600 }}>
            <MessageCircle size={17} /> {post.commentCount ?? 0}
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: 'var(--text-muted)', fontSize: 13, fontWeight: 600 }}>
            <Eye size={17} /> {post.viewCount ?? 0}
          </div>
          {(post.category || post.urgency) && (
            <span style={{ marginLeft: 'auto', fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 99, background: 'var(--border)', color: 'var(--text-muted)' }}>
              {post.urgency ?? post.category}
            </span>
          )}
        </div>

        {/* App CTA */}
        <div style={{ margin: '16px', padding: '16px', background: 'linear-gradient(135deg, #e8f5e9, #f1f8e9)', borderRadius: 14, border: '1px solid #c8e6c9', textAlign: 'center' }}>
          <p style={{ fontWeight: 700, fontSize: 15, color: '#2e7d32', marginBottom: 6 }}>See more on Gaubook</p>
          <p style={{ fontSize: 13, color: '#388e3c', marginBottom: 12 }}>Like, comment and share on the app</p>
          <button
            onClick={() => setAppGate(true)}
            style={{ padding: '11px 28px', borderRadius: 99, background: '#2e7d32', border: 'none', color: 'white', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}
          >
            Open in Gaubook App
          </button>
        </div>

        {/* More from author */}
        {post.user?.id && (
          <div style={{ padding: '0 16px' }}>
            <Link
              href={`/gaushala/${post.user.id}`}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '12px', borderRadius: 12, border: '1px solid var(--border)', textDecoration: 'none', color: 'var(--primary)', fontWeight: 700, fontSize: 14 }}
            >
              View {authorName}&apos;s profile
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
