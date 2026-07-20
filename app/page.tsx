'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Heart, MessageCircle, Flame, X, ChevronLeft, ChevronRight, Plus, User, Leaf, AlertTriangle } from 'lucide-react';
import { feedApi, rescueApi } from '@/lib/api';
import { isLoggedIn } from '@/lib/auth';
import { AppGateModal } from '@/components/AppGate';

interface Post {
  id: string;
  content?: string;
  caption?: string;
  type?: string;
  postType?: string;
  images?: string[];
  imageUrls?: string[];
  imageUrl?: string;
  createdAt: string;
  User?: {
    fullname: string;
    profilePhoto?: string;
    role: string | string[];
  };
  user?: {
    fullname: string;
    profilePhoto?: string;
    role: string | string[];
  };
  _count?: {
    likes: number;
    comments: number;
  };
  likesCount?: number;
  commentsCount?: number;
}

function timeAgo(date: string): string {
  const diff = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 2592000) return `${Math.floor(diff / 86400)}d ago`;
  return `${Math.floor(diff / 2592000)}mo ago`;
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

function getRoleLabel(role: string | string[]): string {
  return Array.isArray(role) ? role[0] || '' : role || '';
}

const FILTERS = [
  { label: 'All', value: '' },
  { label: 'Gaushala', value: 'Gaushala' },
  { label: 'Vendor', value: 'Vendor' },
  { label: 'Expert', value: 'Expert' },
  { label: 'Volunteer', value: 'Volunteer' },
];

function ImageGrid({ images }: { images: string[] }) {
  const count = Math.min(images.length, 4);
  if (!count) return null;

  if (count === 1) {
    return (
      <div className="rounded-xl overflow-hidden" style={{ aspectRatio: '1/1' }}>
        <img src={images[0]} alt="" className="w-full h-full object-cover" />
      </div>
    );
  }

  if (count === 2) {
    return (
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, borderRadius: 12, overflow: 'hidden' }}>
        {images.slice(0, 2).map((img, i) => (
          <img key={i} src={img} alt="" className="w-full object-cover" style={{ aspectRatio: '1' }} />
        ))}
      </div>
    );
  }

  if (count === 3) {
    return (
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gridTemplateRows: '140px 140px',
          gap: 2,
          borderRadius: 12,
          overflow: 'hidden',
        }}
      >
        <img src={images[0]} alt="" className="object-cover w-full h-full" style={{ gridRow: '1 / 3' }} />
        <img src={images[1]} alt="" className="object-cover w-full h-full" />
        <img src={images[2]} alt="" className="object-cover w-full h-full" />
      </div>
    );
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, borderRadius: 12, overflow: 'hidden' }}>
      {images.slice(0, 4).map((img, i) => (
        <img key={i} src={img} alt="" className="w-full object-cover" style={{ aspectRatio: '1' }} />
      ))}
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="card p-4" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div className="skeleton" style={{ width: 40, height: 40, borderRadius: '50%', flexShrink: 0 }} />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div className="skeleton" style={{ height: 14, width: 128, borderRadius: 6 }} />
          <div className="skeleton" style={{ height: 12, width: 80, borderRadius: 6 }} />
        </div>
      </div>
      <div className="skeleton" style={{ height: 14, width: '100%', borderRadius: 6 }} />
      <div className="skeleton" style={{ height: 14, width: '75%', borderRadius: 6 }} />
      <div className="skeleton" style={{ height: 160, width: '100%', borderRadius: 12 }} />
    </div>
  );
}

/* ── Story viewer overlay ── */
const STORY_DURATION = 5000; // ms per story

function StoryViewer({
  stories,
  startIndex,
  onClose,
}: {
  stories: Post[];
  startIndex: number;
  onClose: () => void;
}) {
  const [idx, setIdx] = useState(startIndex);
  const [progress, setProgress] = useState(0);
  const [paused, setPaused] = useState(false);
  const startTimeRef = useRef<number>(Date.now());
  const rafRef = useRef<number>(0);

  const story = stories[idx];
  const author = story?.User ?? story?.user;
  const imgs: string[] = story?.imageUrls ?? story?.images ?? (story?.imageUrl ? [story.imageUrl] : []);
  const text = story?.content ?? story?.caption ?? '';

  const goNext = useCallback(() => {
    setProgress(0);
    if (idx < stories.length - 1) setIdx((i) => i + 1);
    else onClose();
  }, [idx, stories.length, onClose]);

  const goPrev = useCallback(() => {
    setProgress(0);
    if (idx > 0) setIdx((i) => i - 1);
  }, [idx]);

  // RAF-based smooth progress — no interval jitter
  useEffect(() => {
    setProgress(0);
    startTimeRef.current = Date.now();
    const tick = () => {
      if (paused) { rafRef.current = requestAnimationFrame(tick); return; }
      const elapsed = Date.now() - startTimeRef.current;
      const pct = Math.min((elapsed / STORY_DURATION) * 100, 100);
      setProgress(pct);
      if (pct < 100) rafRef.current = requestAnimationFrame(tick);
      else goNext();
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [idx, paused, goNext]);

  // Pause on long press
  const holdTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onPressStart = () => {
    holdTimer.current = setTimeout(() => {
      setPaused(true);
      startTimeRef.current = Date.now() - (progress / 100) * STORY_DURATION;
    }, 150);
  };
  const onPressEnd = () => {
    if (holdTimer.current) clearTimeout(holdTimer.current);
    setPaused(false);
    startTimeRef.current = Date.now() - (progress / 100) * STORY_DURATION;
  };

  if (!story) return null;

  // Warm story gradients for text-only stories
  const textGradients = [
    'linear-gradient(160deg, #F07B1D 0%, #7B4A1E 100%)',
    'linear-gradient(160deg, #C9A227 0%, #7B4A1E 100%)',
    'linear-gradient(160deg, #E05A0C 0%, #C9A227 100%)',
    'linear-gradient(160deg, #7B4A1E 0%, #F07B1D 100%)',
  ];

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 2000,
        background: '#000',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
    >
      {/* Backdrop click to close (outside card on desktop) */}
      <div style={{ position: 'absolute', inset: 0 }} onClick={onClose} />

      <div
        style={{
          width: '100%', maxWidth: 390,
          height: '100dvh', maxHeight: 844,
          position: 'relative', overflow: 'hidden',
          borderRadius: window.innerWidth > 500 ? 20 : 0,
          background: '#111',
        }}
        onMouseDown={onPressStart}
        onMouseUp={onPressEnd}
        onTouchStart={onPressStart}
        onTouchEnd={onPressEnd}
      >
        {/* ── Story content ── */}
        {imgs[0] ? (
          <img
            key={imgs[0]}
            src={imgs[0]}
            alt=""
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : (
          <div
            style={{
              position: 'absolute', inset: 0,
              background: textGradients[idx % textGradients.length],
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              padding: '80px 28px',
            }}
          >
            <p style={{
              color: 'white', fontSize: 24, fontWeight: 700,
              textAlign: 'center', lineHeight: 1.5,
              letterSpacing: '-0.3px',
              textShadow: '0 2px 12px rgba(0,0,0,0.25)',
            }}>{text}</p>
          </div>
        )}

        {/* Top fade for readability */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 120, background: 'linear-gradient(to bottom, rgba(0,0,0,0.55) 0%, transparent 100%)', pointerEvents: 'none' }} />

        {/* Bottom fade + text overlay */}
        {(imgs[0] && text) || imgs[0] ? (
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'linear-gradient(transparent, rgba(0,0,0,0.7))', padding: '60px 20px 32px', pointerEvents: 'none' }}>
            {imgs[0] && text && (
              <p style={{ color: 'white', fontSize: 15, lineHeight: 1.6, fontWeight: 500 }}>{text}</p>
            )}
          </div>
        ) : null}

        {/* ── Progress bars ── */}
        <div style={{ position: 'absolute', top: 12, left: 10, right: 10, zIndex: 20, display: 'flex', gap: 4 }}>
          {stories.map((_, i) => (
            <div
              key={i}
              style={{
                flex: 1, height: 2, borderRadius: 2,
                background: 'rgba(255,255,255,0.28)',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  height: '100%', borderRadius: 2,
                  background: 'white',
                  width: i < idx ? '100%' : i === idx ? `${progress}%` : '0%',
                  transition: i === idx ? 'none' : 'none',
                }}
              />
            </div>
          ))}
        </div>

        {/* ── Header ── */}
        <div style={{
          position: 'absolute', top: 24, left: 12, right: 12,
          zIndex: 20, display: 'flex', alignItems: 'center', gap: 10,
        }}>
          {/* Avatar */}
          <div style={{
            width: 38, height: 38, borderRadius: '50%',
            border: '2px solid #F07B1D',
            overflow: 'hidden', flexShrink: 0,
            background: '#F07B1D',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            {author?.profilePhoto
              ? <img src={author.profilePhoto} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : <span style={{ color: 'white', fontWeight: 800, fontSize: 16 }}>
                  {(author?.fullname ?? 'G')[0].toUpperCase()}
                </span>
            }
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ color: 'white', fontWeight: 700, fontSize: 13.5, lineHeight: 1.2, textTransform: 'capitalize', textShadow: '0 1px 4px rgba(0,0,0,0.4)' }}>
              {(author?.fullname ?? 'Gaubook User').toLowerCase()}
            </p>
            <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 11, marginTop: 1 }}>
              {timeAgo(story.createdAt)}
              {paused && <span style={{ marginLeft: 6, background: 'rgba(255,255,255,0.2)', borderRadius: 4, padding: '0 5px', fontSize: 10 }}>PAUSED</span>}
            </p>
          </div>

          <button
            onClick={(e) => { e.stopPropagation(); onClose(); }}
            style={{
              background: 'rgba(0,0,0,0.35)', border: 'none', borderRadius: '50%',
              width: 34, height: 34,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', color: 'white',
              backdropFilter: 'blur(4px)',
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* ── Tap zones (prev left 40%, next right 40%) ── */}
        <button
          onClick={(e) => { e.stopPropagation(); goPrev(); }}
          style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '40%', background: 'transparent', border: 'none', cursor: idx > 0 ? 'pointer' : 'default', zIndex: 10 }}
        />
        <button
          onClick={(e) => { e.stopPropagation(); goNext(); }}
          style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: '40%', background: 'transparent', border: 'none', cursor: 'pointer', zIndex: 10 }}
        />
      </div>
    </div>
  );
}

/* ── Story strip ── */
function StoryStrip({ stories, onStoryClick, onAddStory }: {
  stories: Post[];
  onStoryClick: (index: number) => void;
  onAddStory: () => void;
}) {

  return (
    <div
      className="scrollbar-hide"
      style={{
        display: 'flex',
        gap: 12,
        overflowX: 'auto',
        paddingBottom: 4,
        marginBottom: 12,
        marginLeft: -16,
        marginRight: -16,
        paddingLeft: 16,
        paddingRight: 16,
      }}
    >
      {/* Add Story button */}
      <button
        onClick={onAddStory}
        style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, flexShrink: 0, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
      >
        <div style={{ position: 'relative', width: 68, height: 68 }}>
          <div style={{
            width: '100%', height: '100%', borderRadius: '50%',
            background: 'var(--surface)',
            border: '2px dashed var(--primary)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <User size={26} color="var(--primary)" />
          </div>
          <div style={{
            position: 'absolute', bottom: 0, right: 0,
            width: 22, height: 22, borderRadius: '50%',
            background: 'var(--primary)', border: '2px solid white',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Plus size={13} color="white" strokeWidth={3} />
          </div>
        </div>
        <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, whiteSpace: 'nowrap' }}>Your Story</span>
      </button>

      {/* Story circles */}
      {stories.map((story, i) => {
        const author = story.User ?? story.user;
        const name = author?.fullname ?? 'User';
        const firstName = name.split(' ')[0];
        return (
          <button
            key={story.id}
            onClick={() => onStoryClick(i)}
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, flexShrink: 0, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
          >
            {/* Gradient ring */}
            <div style={{
              width: 68, height: 68, borderRadius: '50%',
              padding: 2.5,
              background: 'linear-gradient(135deg, #F07B1D 0%, #C9A227 50%, #F07B1D 100%)',
              flexShrink: 0,
            }}>
              <div style={{ width: '100%', height: '100%', borderRadius: '50%', border: '2.5px solid white', overflow: 'hidden', background: 'var(--primary-light)' }}>
                {author?.profilePhoto
                  ? <img src={author.profilePhoto} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg, var(--primary) 0%, var(--brown) 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 800, fontSize: 22 }}>
                      {name[0].toUpperCase()}
                    </div>
                }
              </div>
            </div>
            <span style={{ fontSize: 11, color: 'var(--text)', fontWeight: 600, whiteSpace: 'nowrap', maxWidth: 68, overflow: 'hidden', textOverflow: 'ellipsis', textTransform: 'capitalize' }}>
              {firstName.toLowerCase()}
            </span>
          </button>
        );
      })}
    </div>
  );
}

function PostCard({ post }: { post: Post }) {
  const author = post.User ?? post.user;
  const role = author ? getRoleLabel(author.role) : '';
  const initials = author ? getInitials(author.fullname) : 'G';
  const text = post.content ?? post.caption ?? '';
  const imgs: string[] = post.imageUrls ?? post.images ?? (post.imageUrl ? [post.imageUrl] : []);
  const likes = post._count?.likes ?? post.likesCount ?? 0;
  const comments = post._count?.comments ?? post.commentsCount ?? 0;

  return (
    <div className="card card-hover">
      <div className="p-4 pb-3">
        {/* Author row */}
        <div style={{ display: 'flex', gap: 11, alignItems: 'flex-start' }}>
          {/* Avatar with ring */}
          <div
            style={{
              width: 42, height: 42, borderRadius: '50%',
              background: 'linear-gradient(135deg, var(--primary), var(--primary-dark))',
              flexShrink: 0, overflow: 'hidden',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'white', fontWeight: 700, fontSize: 15,
              border: '2px solid var(--primary)',
              outline: '2px solid var(--primary-light)',
              outlineOffset: 1,
            }}
          >
            {author?.profilePhoto ? (
              <img src={author.profilePhoto} alt={author.fullname} className="w-full h-full object-cover" />
            ) : initials}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            {/* Name + role on one line */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, flexWrap: 'wrap' }}>
              <span style={{ fontWeight: 700, fontSize: 14, color: 'var(--text)', textTransform: 'capitalize', letterSpacing: '-0.2px' }}>
                {(author?.fullname ?? 'Gaubook User').toLowerCase()}
              </span>
              {role && (
                <span className="badge badge-primary" style={{ fontSize: 10.5, padding: '2px 8px' }}>
                  {role}
                </span>
              )}
            </div>
            {/* Time as muted small text */}
            <p style={{ fontSize: 11.5, color: 'var(--text-muted)', marginTop: 1, fontWeight: 500 }}>
              {timeAgo(post.createdAt)}
            </p>
          </div>
        </div>

        {/* Content */}
        {text && (
          <p style={{ marginTop: 12, fontSize: 14.5, color: 'var(--text)', lineHeight: 1.62 }}>
            {text}
          </p>
        )}
      </div>

      {/* Images */}
      {imgs.length > 0 && (
        <div className="px-4 pb-3">
          <ImageGrid images={imgs} />
        </div>
      )}

      {/* Reaction row */}
      <div
        className="px-4 py-3"
        style={{ borderTop: '1px solid var(--border)', display: 'flex', gap: 18, alignItems: 'center' }}
      >
        <button
          style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer', padding: '4px 6px', borderRadius: 8, transition: 'color 0.15s' }}
        >
          <Heart size={16} strokeWidth={1.8} />
          <span style={{ fontWeight: 600 }}>{likes}</span>
        </button>
        <button
          style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer', padding: '4px 6px', borderRadius: 8, transition: 'color 0.15s' }}
        >
          <MessageCircle size={16} strokeWidth={1.8} />
          <span style={{ fontWeight: 600 }}>{comments}</span>
        </button>
      </div>
    </div>
  );
}

interface RescueAlert {
  id: string;
  description?: string;
  type?: string;
  status?: string;
  address?: string;
  city?: string;
  images?: string[];
  photoUrl?: string;
  createdAt: string;
  reporter?: { fullname?: string; profilePhoto?: string };
}

export default function HomePage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [stories, setStories] = useState<Post[]>([]);
  const [viewingStory, setViewingStory] = useState<number | null>(null);
  const [appGate, setAppGate] = useState(false);
  const [activeFilter, setActiveFilter] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [loggedIn, setLoggedIn] = useState(false);
  const [latestRescue, setLatestRescue] = useState<RescueAlert | null>(null);
  const loaderRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setLoggedIn(isLoggedIn());
  }, []);

  // Fetch latest rescue alert
  useEffect(() => {
    rescueApi.getAll({ page: 1, limit: 1 }).then((res) => {
      const raw = res.data;
      const list = Array.isArray(raw?.data?.reports) ? raw.data.reports
        : Array.isArray(raw?.data) ? raw.data
        : Array.isArray(raw) ? raw : [];
      if (list.length > 0) setLatestRescue(list[0]);
    }).catch(() => {});
  }, []);

  // Extract stories from the main feed — the backend uses postType="Story" (capital S)
  useEffect(() => {
    setStories(posts.filter((p) => p.postType?.toLowerCase() === 'story'));
  }, [posts]);

  const fetchPosts = useCallback(async (pg: number, replace: boolean) => {
    try {
      if (replace) setLoading(true);
      else setLoadingMore(true);

      const res = await feedApi.getPosts(pg, 20);
      const raw = res.data;
      let list: Post[] = [];
      if (Array.isArray(raw)) list = raw;
      else if (Array.isArray(raw?.data?.posts)) list = raw.data.posts;
      else if (Array.isArray(raw?.data)) list = raw.data;
      else if (Array.isArray(raw?.posts)) list = raw.posts;

      setPosts((prev) => (replace ? list : [...prev, ...list]));
      setHasMore(list.length === 20);
    } catch {
      setHasMore(false);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    setPage(1);
    fetchPosts(1, true);
  }, [fetchPosts]);

  // Client-side role filter
  const filteredPosts = activeFilter
    ? posts.filter((p) => {
        const role = p.User?.role ?? p.user?.role ?? '';
        const r = Array.isArray(role) ? role[0] : role;
        return r?.toLowerCase() === activeFilter.toLowerCase();
      })
    : posts;

  useEffect(() => {
    const el = loaderRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && hasMore && !loadingMore && !loading) {
          const next = page + 1;
          setPage(next);
          fetchPosts(next, false);
        }
      },
      { threshold: 0.1 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasMore, loadingMore, loading, page, fetchPosts]);

  return (
    <div style={{ background: 'var(--canvas)', paddingBottom: 80 }}>
      {viewingStory !== null && (
        <StoryViewer
          stories={stories}
          startIndex={viewingStory}
          onClose={() => setViewingStory(null)}
        />
      )}
      {appGate && (
        <AppGateModal feature="Post Stories" onClose={() => setAppGate(false)} />
      )}

      {/* Guest Hero — no background, just content */}
      {!loggedIn && (
        <div style={{ maxWidth: 640, margin: '0 auto', padding: '28px 16px 20px' }}>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: 'var(--text)', lineHeight: 1.18, letterSpacing: '-0.5px', marginBottom: 6 }}>
            Connect. Care.<br />Celebrate Gau Seva.
          </h1>
          <p style={{ fontSize: 13.5, color: 'var(--text-muted)', marginBottom: 18, lineHeight: 1.55 }}>
            Join thousands of gaushala owners, vets &amp; gau-seva volunteers across India.
          </p>
          <div style={{ display: 'flex', gap: 10 }}>
            <Link href="/register" style={{ padding: '10px 22px', borderRadius: 100, background: 'var(--primary)', color: 'white', fontSize: 13.5, fontWeight: 700, textDecoration: 'none' }}>
              Get Started
            </Link>
            <Link href="/login" style={{ padding: '10px 20px', borderRadius: 100, border: '1.5px solid var(--border)', color: 'var(--text)', fontSize: 13.5, fontWeight: 600, textDecoration: 'none' }}>
              Login
            </Link>
          </div>
        </div>
      )}

      <div style={{ maxWidth: 640, margin: '0 auto', padding: '16px 16px 0' }}>
        {/* Stories strip */}
        <StoryStrip
          stories={stories}
          onStoryClick={(i) => setViewingStory(i)}
          onAddStory={() => setAppGate(true)}
        />

        {/* Filter pills */}
        <div
          className="scrollbar-hide"
          style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4, marginBottom: 16 }}
        >
          {FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setActiveFilter(f.value)}
              className={`filter-pill${activeFilter === f.value ? ' active' : ''}`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Loading skeletons */}
        {loading && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>
        )}

        {/* Empty state */}
        {!loading && filteredPosts.length === 0 && (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              paddingTop: 72,
              paddingBottom: 72,
              textAlign: 'center',
            }}
          >
            {/* Illustrated empty state */}
            <div
              style={{
                width: 96,
                height: 96,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, var(--primary-light), #FFF9F3)',
                border: '2px solid var(--border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 20,
              }}
            >
              <Leaf size={40} color="var(--primary)" />
            </div>
            <span className="eyebrow" style={{ marginBottom: 10 }}>Community Feed</span>
            <h3 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text)', marginBottom: 8, letterSpacing: '-0.3px' }}>
              Nothing here yet
            </h3>
            <p style={{ fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.6, maxWidth: 260 }}>
              Be the first to share something with the Gau seva community.
            </p>
            <div style={{ marginTop: 20, fontSize: 24, display: 'flex', gap: 6, opacity: 0.5 }}>
              <Flame size={22} color="var(--primary)" />
            </div>
          </div>
        )}

        {/* Rescue Alert Banner */}
        {latestRescue && (
          <Link href="/rescue" style={{ textDecoration: 'none', display: 'block', marginBottom: 16 }}>
            <div style={{
              background: 'linear-gradient(135deg, #C0392B 0%, #E74C3C 100%)',
              borderRadius: 14, overflow: 'hidden', display: 'flex', alignItems: 'stretch',
            }}>
              {(latestRescue.images?.[0] ?? latestRescue.photoUrl) && (
                <img src={latestRescue.images?.[0] ?? latestRescue.photoUrl} alt="" style={{ width: 90, objectFit: 'cover', flexShrink: 0 }} />
              )}
              <div style={{ padding: '12px 14px', flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 5 }}>
                  <span style={{ background: 'white', color: '#C0392B', fontSize: 9, fontWeight: 900, letterSpacing: 1.2, padding: '2px 6px', borderRadius: 4 }}>SOS</span>
                  <span style={{ color: 'white', fontSize: 12, fontWeight: 800, letterSpacing: 1 }}>RESCUE ALERT</span>
                  {latestRescue.type && (
                    <span style={{ marginLeft: 'auto', background: 'rgba(255,255,255,0.2)', color: 'white', fontSize: 10, fontWeight: 600, padding: '2px 10px', borderRadius: 20 }}>
                      🩹 {latestRescue.type}
                    </span>
                  )}
                </div>
                <p style={{ color: 'rgba(255,255,255,0.9)', fontSize: 12.5, lineHeight: 1.4, margin: 0 }}>
                  {latestRescue.reporter?.fullname ?? 'Someone'} reported {latestRescue.type?.toLowerCase() ?? 'an animal'} needing help
                  {latestRescue.city ? ` · ${latestRescue.city}` : ''}
                </p>
                <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 10.5, marginTop: 4 }}>{timeAgo(latestRescue.createdAt)} · Tap to view</p>
              </div>
            </div>
          </Link>
        )}

        {/* Posts */}
        {!loading && filteredPosts.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {filteredPosts.map((post, i) => (
              <PostCard key={post.id ?? i} post={post} />
            ))}
          </div>
        )}

        {/* Infinite scroll sentinel */}
        <div ref={loaderRef} style={{ height: 48, display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: 8 }}>
          {loadingMore && (
            <div
              style={{
                width: 24,
                height: 24,
                borderRadius: '50%',
                border: '2.5px solid var(--border)',
                borderTopColor: 'var(--primary)',
                animation: 'spin 0.7s linear infinite',
              }}
            />
          )}
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
