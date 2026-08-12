'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, Heart, MessageCircle, Eye, Share2, Check, ChevronLeft, ChevronRight, X, ZoomIn } from 'lucide-react';
import { feedApi } from '@/lib/api';
import toast from 'react-hot-toast';
import { AppGateModal } from '@/components/AppGate';
import { isLoggedIn } from '@/lib/auth';

const BACKEND = process.env.NEXT_PUBLIC_API_URL ?? 'https://app.gaubook.org';

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

function ImageCarousel({ images }: { images: string[] }) {
  const [idx, setIdx] = useState(0);
  const [lightbox, setLightbox] = useState(false);
  const touchStartX = useRef<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const next = useCallback(() => setIdx(i => (i + 1) % images.length), [images.length]);
  const prev = useCallback(() => setIdx(i => (i - 1 + images.length) % images.length), [images.length]);

  const stopTimer = useCallback(() => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
  }, []);
  const startTimer = useCallback(() => {
    stopTimer();
    if (images.length <= 1) return;
    timerRef.current = setInterval(next, 5000);
  }, [images.length, next, stopTimer]);

  useEffect(() => { startTimer(); return stopTimer; }, [startTimer, stopTimer]);

  const onTouchStart = (e: React.TouchEvent) => { touchStartX.current = e.touches[0].clientX; };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(dx) > 40) { dx < 0 ? next() : prev(); startTimer(); }
    touchStartX.current = null;
  };

  const arrowBtn: React.CSSProperties = {
    position: 'absolute', top: '50%', transform: 'translateY(-50%)',
    background: 'rgba(0,0,0,0.45)', border: 'none', borderRadius: '50%',
    width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center',
    cursor: 'pointer', color: 'white', zIndex: 2,
  };

  return (
    <>
      <div
        style={{ position: 'relative', background: '#111', overflow: 'hidden', userSelect: 'none' }}
        onMouseEnter={stopTimer} onMouseLeave={startTimer}
        onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}
      >
        <div
          style={{ maxHeight: 460, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'zoom-in', aspectRatio: images.length > 0 ? undefined : '4/3' }}
          onClick={() => setLightbox(true)}
        >
          <Image
            src={images[idx]}
            alt="Post image"
            width={800}
            height={460}
            style={{ width: '100%', maxHeight: 460, objectFit: 'contain', display: 'block', height: 'auto' }}
            onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
          />
        </div>

        {/* Zoom hint */}
        <div
          onClick={() => setLightbox(true)}
          style={{ position: 'absolute', bottom: images.length > 1 ? 38 : 10, right: 10, background: 'rgba(0,0,0,0.5)', borderRadius: 6, padding: '4px 7px', display: 'flex', cursor: 'pointer' }}
        >
          <ZoomIn size={15} color="white" />
        </div>

        {/* Arrows */}
        {images.length > 1 && idx > 0 && (
          <button style={{ ...arrowBtn, left: 10 }} onClick={e => { e.stopPropagation(); prev(); startTimer(); }}>
            <ChevronLeft size={18} />
          </button>
        )}
        {images.length > 1 && idx < images.length - 1 && (
          <button style={{ ...arrowBtn, right: 10 }} onClick={e => { e.stopPropagation(); next(); startTimer(); }}>
            <ChevronRight size={18} />
          </button>
        )}

        {/* Counter badge */}
        {images.length > 1 && (
          <div style={{ position: 'absolute', top: 10, right: 10, background: 'rgba(0,0,0,0.55)', borderRadius: 99, padding: '3px 10px', fontSize: 12, fontWeight: 700, color: 'white' }}>
            {idx + 1} / {images.length}
          </div>
        )}

        {/* Dot indicators */}
        {images.length > 1 && (
          <div style={{ position: 'absolute', bottom: 10, left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: 5, zIndex: 2 }}>
            {images.map((_, i) => (
              <div
                key={i}
                onClick={e => { e.stopPropagation(); setIdx(i); startTimer(); }}
                style={{ width: idx === i ? 18 : 6, height: 6, borderRadius: 3, background: idx === i ? 'white' : 'rgba(255,255,255,0.45)', cursor: 'pointer', transition: 'width 0.2s ease' }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Lightbox */}
      {lightbox && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.93)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          onClick={() => setLightbox(false)}
        >
          <button
            onClick={() => setLightbox(false)}
            style={{ position: 'absolute', top: 16, right: 16, background: 'rgba(255,255,255,0.12)', border: 'none', borderRadius: '50%', width: 40, height: 40, color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <X size={20} />
          </button>
          <Image
            src={images[idx]}
            alt=""
            width={800}
            height={600}
            style={{ maxWidth: '94vw', maxHeight: '90vh', objectFit: 'contain', borderRadius: 8, boxShadow: '0 24px 80px rgba(0,0,0,0.7)', width: 'auto', height: 'auto' }}
            onClick={e => e.stopPropagation()}
          />
          {images.length > 1 && (
            <>
              {idx > 0 && (
                <button onClick={e => { e.stopPropagation(); prev(); }} style={{ ...arrowBtn, left: 16, position: 'fixed' }}>
                  <ChevronLeft size={20} />
                </button>
              )}
              {idx < images.length - 1 && (
                <button onClick={e => { e.stopPropagation(); next(); }} style={{ ...arrowBtn, right: 16, position: 'fixed' }}>
                  <ChevronRight size={20} />
                </button>
              )}
              <div style={{ position: 'fixed', bottom: 20, left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: 6 }}>
                {images.map((_, i) => (
                  <div key={i} onClick={e => { e.stopPropagation(); setIdx(i); }} style={{ width: idx === i ? 18 : 6, height: 6, borderRadius: 3, background: idx === i ? 'white' : 'rgba(255,255,255,0.4)', cursor: 'pointer', transition: 'width 0.2s ease' }} />
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
}

function getProfilePath(user?: PostAuthor): string {
  if (!user) return '/';
  const role = (Array.isArray(user.role) ? user.role[0] : user.role)?.toString().toLowerCase() ?? '';
  if (role.includes('gaushala') || role.includes('ngo')) return `/gaushala/${user.id}`;
  if (role.includes('vendor')) return `/gaushala/${user.id}`;
  if (role.includes('expert')) return `/expert/${user.id}`;
  return `/profile/${user.id}`;
}

export default function PostDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [post, setPost] = useState<PostData | null>(null);
  const [loading, setLoading] = useState(true);
  const [appGate, setAppGate] = useState(false);
  const [copied, setCopied] = useState(false);
  const [liked, setLiked] = useState(false);
  const [postLikeCount, setPostLikeCount] = useState<number | null>(null);
  const loggedIn = isLoggedIn();

  useEffect(() => {
    if (!id) return;
    feedApi.getPostById(id)
      .then((res) => {
        const raw = res.data?.data ?? res.data;
        if (raw?.id) setPost(raw);
      })
      .catch(() => { toast.error('Failed to load post.'); })
      .finally(() => setLoading(false));
  }, [id]);

  const handleLike = async () => {
    if (!post) return;
    const wasLiked = liked;
    const base = postLikeCount ?? post.likeCount ?? 0;
    setLiked(!wasLiked);
    setPostLikeCount(base + (wasLiked ? -1 : 1));
    try {
      await feedApi.likePost(post.id);
    } catch {
      setLiked(wasLiked);
      setPostLikeCount(base);
    }
  };

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      navigator.share({ url }).catch(() => {});
      return;
    }
    navigator.clipboard.writeText(url)
      .then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); })
      .catch(() => {});
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
          <Link href={getProfilePath(post.user)} style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 42, height: 42, borderRadius: '50%', overflow: 'hidden', background: 'var(--primary-tint, #f0faf5)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1.5px solid var(--border)' }}>
              {authorPhoto
                ? <Image src={resolveImg(authorPhoto)!} alt={authorName} width={42} height={42} style={{ objectFit: 'cover', borderRadius: '50%' }} />
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
        {images.length > 0 && <ImageCarousel images={images} />}

        {/* Stats row */}
        <div style={{ display: 'flex', gap: 20, padding: '12px 16px', borderBottom: '1px solid var(--border)' }}>
          <button onClick={loggedIn ? handleLike : () => setAppGate(true)} style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'none', border: 'none', cursor: 'pointer', color: liked ? '#E53935' : 'var(--text-muted)', fontSize: 13, fontWeight: 600 }}>
            <Heart size={17} fill={liked ? '#E53935' : 'none'} /> {postLikeCount ?? post.likeCount ?? 0}
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
              href={getProfilePath(post.user)}
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
