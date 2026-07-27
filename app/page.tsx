'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { Heart, MessageCircle, X, Plus, User, Leaf, Flame, AlertTriangle, Share2, UserPlus } from 'lucide-react';
import { feedApi, rescueApi } from '@/lib/api';
import { isLoggedIn } from '@/lib/auth';
import { AppGateModal } from '@/components/AppGate';

const BACKEND = 'https://app.gaubook.org';
function resolveImg(url?: string | null): string | undefined {
  if (!url) return undefined;
  if (url.startsWith('http')) return url;
  if (url.startsWith('/')) return `${BACKEND}${url}`;
  return url;
}

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
  User?: { fullname: string; profilePhoto?: string; role: string | string[] };
  user?: { fullname: string; profilePhoto?: string; role: string | string[] };
  likeCount?: number;
  commentCount?: number;
  shareCount?: number;
  _count?: { likes: number; comments: number; shares?: number };
  likesCount?: number;
  commentsCount?: number;
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

function timeAgo(date: string): string {
  const diff = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 2592000) return `${Math.floor(diff / 86400)}d ago`;
  return `${Math.floor(diff / 2592000)}mo ago`;
}

function getInitials(name: string): string {
  return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
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
  { label: 'Influencer', value: 'Influencer' },
  { label: 'NGO', value: 'NGO' },
];

/* ─── Image Lightbox ─────────────────────────────────────────────────────── */

function ImageLightbox({ images, startIndex, onClose }: { images: string[]; startIndex: number; onClose: () => void }) {
  const [idx, setIdx] = useState(startIndex);
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') setIdx(i => Math.min(i + 1, images.length - 1));
      if (e.key === 'ArrowLeft') setIdx(i => Math.max(i - 1, 0));
    };
    document.addEventListener('keydown', handler);
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', handler); document.body.style.overflow = ''; };
  }, [images.length, onClose]);

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 1100, background: 'rgba(0,0,0,0.92)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <button onClick={e => { e.stopPropagation(); onClose(); }} style={{ position: 'absolute', top: 16, right: 16, background: 'rgba(255,255,255,0.12)', border: 'none', borderRadius: '50%', width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'white', zIndex: 10 }}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </button>
      {idx > 0 && (
        <button onClick={e => { e.stopPropagation(); setIdx(i => i - 1); }} style={{ position: 'absolute', left: 12, background: 'rgba(255,255,255,0.14)', border: 'none', borderRadius: '50%', width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'white' }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><polyline points="15,18 9,12 15,6"/></svg>
        </button>
      )}
      <img src={images[idx]} alt="" onClick={e => e.stopPropagation()} style={{ maxWidth: '92vw', maxHeight: '88vh', objectFit: 'contain', borderRadius: 10, boxShadow: '0 24px 80px rgba(0,0,0,0.6)' }} />
      {idx < images.length - 1 && (
        <button onClick={e => { e.stopPropagation(); setIdx(i => i + 1); }} style={{ position: 'absolute', right: 12, background: 'rgba(255,255,255,0.14)', border: 'none', borderRadius: '50%', width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'white' }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><polyline points="9,18 15,12 9,6"/></svg>
        </button>
      )}
      {images.length > 1 && (
        <div style={{ position: 'absolute', bottom: 20, display: 'flex', gap: 6 }}>
          {images.map((_, i) => (
            <div key={i} onClick={e => { e.stopPropagation(); setIdx(i); }} style={{ width: i === idx ? 20 : 7, height: 7, borderRadius: 100, background: i === idx ? 'white' : 'rgba(255,255,255,0.35)', cursor: 'pointer', transition: 'all 0.2s' }} />
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── Image Grid ─────────────────────────────────────────────────────────── */

function ImageGrid({ images, onImageClick }: { images: string[]; onImageClick: (i: number) => void }) {
  const count = Math.min(images.length, 4);
  if (!count) return null;
  const imgStyle: React.CSSProperties = { cursor: 'pointer', transition: 'opacity 0.15s' };

  if (count === 1) {
    return (
      <div className="rounded-xl overflow-hidden" style={{ aspectRatio: '4/5' }}>
        <img src={images[0]} alt="" className="w-full h-full object-cover" style={imgStyle} onClick={() => onImageClick(0)} />
      </div>
    );
  }
  if (count === 2) {
    return (
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, borderRadius: 12, overflow: 'hidden' }}>
        {images.slice(0, 2).map((img, i) => (
          <img key={i} src={img} alt="" className="w-full object-cover" style={{ aspectRatio: '1', ...imgStyle }} onClick={() => onImageClick(i)} />
        ))}
      </div>
    );
  }
  if (count === 3) {
    return (
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gridTemplateRows: '140px 140px', gap: 2, borderRadius: 12, overflow: 'hidden' }}>
        <img src={images[0]} alt="" className="object-cover w-full h-full" style={{ gridRow: '1 / 3', ...imgStyle }} onClick={() => onImageClick(0)} />
        <img src={images[1]} alt="" className="object-cover w-full h-full" style={imgStyle} onClick={() => onImageClick(1)} />
        <img src={images[2]} alt="" className="object-cover w-full h-full" style={imgStyle} onClick={() => onImageClick(2)} />
      </div>
    );
  }
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, borderRadius: 12, overflow: 'hidden' }}>
      {images.slice(0, 4).map((img, i) => (
        <img key={i} src={img} alt="" className="w-full object-cover" style={{ aspectRatio: '1', ...imgStyle }} onClick={() => onImageClick(i)} />
      ))}
    </div>
  );
}

/* ─── Skeleton ───────────────────────────────────────────────────────────── */

function SkeletonCard() {
  return (
    <div className="card p-4" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div className="skeleton" style={{ width: 40, height: 40, borderRadius: '50%', flexShrink: 0 }} />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div className="skeleton" style={{ height: 12, width: 120, borderRadius: 6 }} />
          <div className="skeleton" style={{ height: 11, width: 72, borderRadius: 6 }} />
        </div>
      </div>
      <div className="skeleton" style={{ height: 13, width: '100%', borderRadius: 6 }} />
      <div className="skeleton" style={{ height: 13, width: '70%', borderRadius: 6 }} />
      <div className="skeleton" style={{ height: 200, width: '100%', borderRadius: 12 }} />
    </div>
  );
}

/* ─── Story Viewer ───────────────────────────────────────────────────────── */

const STORY_DURATION = 5000;

function StoryViewer({ stories, startIndex, onClose }: { stories: Post[]; startIndex: number; onClose: () => void }) {
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

  const textGradients = [
    'linear-gradient(160deg, #F07B1D 0%, #7B4A1E 100%)',
    'linear-gradient(160deg, #C9A227 0%, #7B4A1E 100%)',
    'linear-gradient(160deg, #E05A0C 0%, #C9A227 100%)',
    'linear-gradient(160deg, #7B4A1E 0%, #F07B1D 100%)',
  ];

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 2000, background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ position: 'absolute', inset: 0 }} onClick={onClose} />
      <div
        style={{ width: '100%', maxWidth: 390, height: '100dvh', maxHeight: 844, position: 'relative', overflow: 'hidden', borderRadius: typeof window !== 'undefined' && window.innerWidth > 500 ? 20 : 0, background: '#111' }}
        onMouseDown={onPressStart} onMouseUp={onPressEnd} onTouchStart={onPressStart} onTouchEnd={onPressEnd}
      >
        {imgs[0] ? (
          <img key={imgs[0]} src={imgs[0]} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'contain', background: '#111' }} />
        ) : (
          <div style={{ position: 'absolute', inset: 0, background: textGradients[idx % textGradients.length], display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '80px 28px' }}>
            <p style={{ color: 'white', fontSize: 24, fontWeight: 700, textAlign: 'center', lineHeight: 1.5, letterSpacing: '-0.3px', textShadow: '0 2px 12px rgba(0,0,0,0.25)' }}>{text}</p>
          </div>
        )}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 120, background: 'linear-gradient(to bottom, rgba(0,0,0,0.55) 0%, transparent 100%)', pointerEvents: 'none' }} />
        {imgs[0] && text && (
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'linear-gradient(transparent, rgba(0,0,0,0.7))', padding: '60px 20px 32px', pointerEvents: 'none' }}>
            <p style={{ color: 'white', fontSize: 15, lineHeight: 1.6, fontWeight: 500 }}>{text}</p>
          </div>
        )}
        {/* Progress bars */}
        <div style={{ position: 'absolute', top: 12, left: 10, right: 10, zIndex: 20, display: 'flex', gap: 4 }}>
          {stories.map((_, i) => (
            <div key={i} style={{ flex: 1, height: 2, borderRadius: 2, background: 'rgba(255,255,255,0.28)', overflow: 'hidden' }}>
              <div style={{ height: '100%', borderRadius: 2, background: 'white', width: i < idx ? '100%' : i === idx ? `${progress}%` : '0%' }} />
            </div>
          ))}
        </div>
        {/* Header */}
        <div style={{ position: 'absolute', top: 24, left: 12, right: 12, zIndex: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 38, height: 38, borderRadius: '50%', border: '2px solid #F07B1D', overflow: 'hidden', flexShrink: 0, background: '#F07B1D', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {author?.profilePhoto
              ? <img src={resolveImg(author.profilePhoto)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : <span style={{ color: 'white', fontWeight: 800, fontSize: 16 }}>{(author?.fullname ?? 'G')[0].toUpperCase()}</span>
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
          <button onClick={(e) => { e.stopPropagation(); onClose(); }} style={{ background: 'rgba(0,0,0,0.35)', border: 'none', borderRadius: '50%', width: 34, height: 34, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'white', backdropFilter: 'blur(4px)' }}>
            <X size={16} />
          </button>
        </div>
        {/* Tap zones */}
        <button onClick={(e) => { e.stopPropagation(); goPrev(); }} style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '40%', background: 'transparent', border: 'none', cursor: idx > 0 ? 'pointer' : 'default', zIndex: 10 }} />
        <button onClick={(e) => { e.stopPropagation(); goNext(); }} style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: '40%', background: 'transparent', border: 'none', cursor: 'pointer', zIndex: 10 }} />
      </div>
    </div>
  );
}

/* ─── Story Strip (Flutter: 75×94px rectangular tiles, 10px radius) ──────── */

function StoryStrip({ stories, onStoryClick, onAddStory }: {
  stories: Post[];
  onStoryClick: (index: number) => void;
  onAddStory: () => void;
}) {
  return (
    <div className="scrollbar-hide" style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4, marginBottom: 12, marginLeft: -16, marginRight: -16, paddingLeft: 16, paddingRight: 16 }}>

      {/* "Your Story" tile — rectangular, white bg, profile icon top + label bottom */}
      <button onClick={onAddStory} style={{ flexShrink: 0, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
        <div style={{ position: 'relative', width: 75, height: 94, borderRadius: 10, overflow: 'hidden', background: 'white', boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
          {/* Top ~65%: warmTint placeholder */}
          <div style={{ height: 61, background: 'var(--warm-tint)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <User size={28} color="var(--primary)" />
          </div>
          {/* Bottom ~35%: "Your Story" label */}
          <div style={{ height: 33, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', paddingBottom: 6 }}>
            <span style={{ fontSize: 10, fontWeight: 600, color: '#000', textAlign: 'center', lineHeight: 1.2 }}>Your Story</span>
          </div>
          {/* Plus badge at the boundary */}
          <div style={{ position: 'absolute', top: 61 - 13, left: '50%', transform: 'translateX(-50%)', width: 26, height: 26, borderRadius: '50%', background: 'var(--primary)', border: '2px solid white', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1 }}>
            <Plus size={13} color="white" strokeWidth={3} />
          </div>
        </div>
      </button>

      {/* Story tiles — rectangular, full-bleed image, gradient overlay, avatar + name */}
      {stories.map((story, i) => {
        const author = story.User ?? story.user;
        const name = author?.fullname ?? 'User';
        const firstName = name.split(' ')[0].toLowerCase();
        const imgSrc = resolveImg(story.imageUrls?.[0] ?? story.images?.[0] ?? story.imageUrl);
        const avatarSrc = resolveImg(author?.profilePhoto);

        return (
          <button key={story.id} onClick={() => onStoryClick(i)} style={{ flexShrink: 0, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
            <div style={{ position: 'relative', width: 75, height: 94, borderRadius: 10, overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
              {/* Background image */}
              {imgSrc ? (
                <img src={imgSrc} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
              ) : (
                <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg, var(--primary) 0%, var(--brown) 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ color: 'white', fontSize: 22, fontWeight: 800 }}>{name[0].toUpperCase()}</span>
                </div>
              )}
              {/* Gradient overlay */}
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0.7) 100%)', pointerEvents: 'none' }} />
              {/* Small avatar top-left (22px, orange border 1.5px) */}
              <div style={{ position: 'absolute', top: 6, left: 6, width: 22, height: 22, borderRadius: '50%', border: '1.5px solid #F07B1D', overflow: 'hidden', flexShrink: 0, background: '#F07B1D', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {avatarSrc
                  ? <img src={avatarSrc} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : <span style={{ color: 'white', fontSize: 9, fontWeight: 800 }}>{name[0].toUpperCase()}</span>
                }
              </div>
              {/* Username bottom-left */}
              <p style={{ position: 'absolute', bottom: 6, left: 6, right: 6, fontSize: 10, fontWeight: 500, color: 'white', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textTransform: 'capitalize', margin: 0, textAlign: 'left' }}>
                {firstName}
              </p>
            </div>
          </button>
        );
      })}
    </div>
  );
}

/* ─── Link preview ───────────────────────────────────────────────────────── */

function extractYouTubeId(url: string): string | null {
  const m = url.match(/[?&]v=([a-zA-Z0-9_-]{11})/) || url.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/) || url.match(/\/shorts\/([a-zA-Z0-9_-]{11})/) || url.match(/\/embed\/([a-zA-Z0-9_-]{11})/);
  return m ? m[1] : null;
}
function detectLink(text: string): { type: 'youtube' | 'instagram' | 'facebook'; url: string } | null {
  const urls = text.match(/https?:\/\/[^\s]+/g) ?? [];
  for (const url of urls) {
    if (url.includes('youtube.com') || url.includes('youtu.be')) return { type: 'youtube', url };
    if (url.includes('instagram.com')) return { type: 'instagram', url };
    if (url.includes('facebook.com') || url.includes('fb.com') || url.includes('fb.watch')) return { type: 'facebook', url };
  }
  return null;
}
function isOnlyUrl(text: string): boolean {
  return /^\s*https?:\/\/[^\s]+\s*$/.test(text.trim());
}

function LinkPreview({ link }: { link: { type: 'youtube' | 'instagram' | 'facebook'; url: string } }) {
  if (link.type === 'youtube') {
    const videoId = extractYouTubeId(link.url);
    if (!videoId) return null;
    return (
      <div style={{ borderRadius: 12, overflow: 'hidden', position: 'relative', background: '#000', aspectRatio: '16/9' }}>
        <iframe src={`https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1`} title="YouTube video" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen" allowFullScreen style={{ width: '100%', height: '100%', border: 'none', display: 'block' }} />
      </div>
    );
  }
  if (link.type === 'instagram') {
    return (
      <a href={link.url} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '13px 16px', borderRadius: 12, textDecoration: 'none', background: 'linear-gradient(135deg,#f09433 0%,#e6683c 25%,#dc2743 50%,#cc2366 75%,#bc1888 100%)' }}>
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8"><rect x="2" y="2" width="20" height="20" rx="5" ry="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.5" cy="6.5" r="1" fill="white" stroke="none" /></svg>
        <div><div style={{ fontSize: 13.5, fontWeight: 700, color: 'white' }}>View on Instagram</div><div style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.75)', marginTop: 1 }}>instagram.com</div></div>
        <svg style={{ marginLeft: 'auto' }} width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth="2.5"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /><polyline points="15,3 21,3 21,9" /><line x1="10" y1="14" x2="21" y2="3" /></svg>
      </a>
    );
  }
  if (link.type === 'facebook') {
    return (
      <a href={link.url} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '13px 16px', borderRadius: 12, textDecoration: 'none', background: '#1877F2' }}>
        <svg width="28" height="28" viewBox="0 0 24 24" fill="white"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" /></svg>
        <div><div style={{ fontSize: 13.5, fontWeight: 700, color: 'white' }}>View on Facebook</div><div style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.75)', marginTop: 1 }}>facebook.com</div></div>
        <svg style={{ marginLeft: 'auto' }} width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth="2.5"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /><polyline points="15,3 21,3 21,9" /><line x1="10" y1="14" x2="21" y2="3" /></svg>
      </a>
    );
  }
  return null;
}

/* ─── Post Card ──────────────────────────────────────────────────────────── */

function PostCard({ post, onInteract }: { post: Post; onInteract?: () => void }) {
  const author = post.User ?? post.user;
  const role = author ? getRoleLabel(author.role) : '';
  const initials = author ? getInitials(author.fullname) : 'G';
  const text = post.content ?? post.caption ?? '';
  const imgs: string[] = post.imageUrls ?? post.images ?? (post.imageUrl ? [post.imageUrl] : []);
  const likes = post.likeCount ?? post._count?.likes ?? post.likesCount ?? 0;
  const comments = post.commentCount ?? post._count?.comments ?? post.commentsCount ?? 0;
  const shares = post.shareCount ?? post._count?.shares ?? 0;
  const link = detectLink(text);

  const handleShare = async () => {
    const url = `${window.location.origin}/post/${post.id}`;
    const shareText = text.slice(0, 120) || 'Check this out on Gaubook';
    if (navigator.share) {
      navigator.share({ title: 'Gaubook', text: shareText, url }).catch(() => {});
    } else {
      await navigator.clipboard.writeText(url).catch(() => {});
    }
  };
  const showText = text && !isOnlyUrl(text);
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);
  const [expanded, setExpanded] = useState(false);
  const CHAR_LIMIT = 220;
  const isLong = text.length > CHAR_LIMIT;
  const displayText = isLong && !expanded ? text.slice(0, CHAR_LIMIT).trimEnd() + '…' : text;

  return (
    <div className="card card-hover">
      <div className="p-4 pb-3">
        {/* Author row — avatar + name/role + Follow button */}
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <div style={{
            width: 40, height: 40, borderRadius: '50%',
            background: 'linear-gradient(135deg, var(--primary), var(--primary-dark))',
            flexShrink: 0, overflow: 'hidden',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'white', fontWeight: 700, fontSize: 14,
          }}>
            {author?.profilePhoto ? (
              <img src={resolveImg(author.profilePhoto)} alt={author.fullname} className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
            ) : initials}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            {/* Username + role inline */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexWrap: 'wrap' }}>
              <span style={{ fontWeight: 500, fontSize: 11.5, color: 'var(--text)', textTransform: 'capitalize', letterSpacing: '-0.1px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 140 }}>
                {(author?.fullname ?? 'Gaubook User').toLowerCase()}
              </span>
              {role && (
                <>
                  <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>·</span>
                  <span style={{ fontSize: 11, fontWeight: 500, color: 'var(--primary)' }}>{role}</span>
                </>
              )}
            </div>
            <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 1, fontWeight: 400 }}>
              {timeAgo(post.createdAt)}
            </p>
          </div>
          {/* Follow button — top right of author row */}
          <button
            onClick={onInteract}
            style={{
              flexShrink: 0, display: 'flex', alignItems: 'center', gap: 4,
              fontSize: 12, fontWeight: 700, color: 'var(--primary)',
              background: 'rgba(240,123,29,0.08)', border: '1.5px solid rgba(240,123,29,0.25)',
              borderRadius: 20, padding: '5px 12px', cursor: 'pointer',
            }}
          >
            <UserPlus size={13} strokeWidth={2} />
            Follow
          </button>
        </div>

        {/* Content text */}
        {showText && (
          <div style={{ marginTop: 10 }}>
            <p style={{ fontSize: 14, color: 'var(--text)', lineHeight: 1.6, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
              {displayText}
            </p>
            {isLong && (
              <button onClick={() => setExpanded(e => !e)} style={{ background: 'none', border: 'none', padding: '4px 0 0', cursor: 'pointer', fontSize: 13, fontWeight: 700, color: 'var(--primary)', letterSpacing: '-0.1px' }}>
                {expanded ? 'Show less' : 'Show more'}
              </button>
            )}
          </div>
        )}
      </div>

      {/* Link preview */}
      {link && (
        <div className="px-4 pb-3"><LinkPreview link={link} /></div>
      )}

      {/* Images — single image is 4:5 portrait (Flutter spec) */}
      {imgs.length > 0 && (
        <div className="px-4 pb-3">
          <ImageGrid images={imgs} onImageClick={(i) => setLightboxIdx(i)} />
        </div>
      )}

      {lightboxIdx !== null && typeof document !== 'undefined' && createPortal(
        <ImageLightbox images={imgs} startIndex={lightboxIdx} onClose={() => setLightboxIdx(null)} />,
        document.body
      )}

      {/* Reaction row */}
      <div className="px-4 py-3" style={{ borderTop: '1px solid var(--border)', display: 'flex', gap: 14, alignItems: 'center' }}>
        <button onClick={onInteract} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer', padding: '4px 6px', borderRadius: 8 }}>
          <Heart size={16} strokeWidth={1.8} />
          <span style={{ fontWeight: 600 }}>{likes}</span>
        </button>
        <button onClick={onInteract} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer', padding: '4px 6px', borderRadius: 8 }}>
          <MessageCircle size={16} strokeWidth={1.8} />
          <span style={{ fontWeight: 600 }}>{comments}</span>
        </button>
        <button onClick={handleShare} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer', padding: '4px 6px', borderRadius: 8 }}>
          <Share2 size={16} strokeWidth={1.8} />
          <span style={{ fontWeight: 600 }}>{shares > 0 ? shares : 'Share'}</span>
        </button>
      </div>
    </div>
  );
}

/* ─── Page ───────────────────────────────────────────────────────────────── */

export default function HomePage() {
  const [posts, setPosts]               = useState<Post[]>([]);
  const [stories, setStories]           = useState<Post[]>([]);
  const [viewingStory, setViewingStory] = useState<number | null>(null);
  const [appGate, setAppGate]           = useState(false);
  const [activeFilter, setActiveFilter] = useState('');
  const [page, setPage]                 = useState(1);
  const [loading, setLoading]           = useState(true);
  const [loadingMore, setLoadingMore]   = useState(false);
  const [hasMore, setHasMore]           = useState(true);
  const [loggedIn, setLoggedIn]         = useState(false);
  const [latestRescue, setLatestRescue] = useState<RescueAlert | null>(null);
  const loaderRef = useRef<HTMLDivElement>(null);

  useEffect(() => { setLoggedIn(isLoggedIn()); }, []);

  useEffect(() => {
    rescueApi.getAll({ page: 1, limit: 1 }).then((res) => {
      const raw = res.data;
      const list = Array.isArray(raw?.data?.reports) ? raw.data.reports
        : Array.isArray(raw?.data) ? raw.data
        : Array.isArray(raw) ? raw : [];
      if (list.length > 0) setLatestRescue(list[0]);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    setStories(posts.filter((p) => p.postType?.toLowerCase() === 'story'));
  }, [posts]);

  const fetchPosts = useCallback(async (pg: number, replace: boolean) => {
    try {
      if (replace) setLoading(true); else setLoadingMore(true);
      const res = await feedApi.getPosts(pg, 20);
      const raw = res.data;
      let list: Post[] = [];
      if (Array.isArray(raw)) list = raw;
      else if (Array.isArray(raw?.data?.posts)) list = raw.data.posts;
      else if (Array.isArray(raw?.data)) list = raw.data;
      else if (Array.isArray(raw?.posts)) list = raw.posts;
      setPosts((prev) => (replace ? list : [...prev, ...list]));
      setHasMore(list.length === 20);
    } catch { setHasMore(false); }
    finally { setLoading(false); setLoadingMore(false); }
  }, []);

  useEffect(() => { setPage(1); fetchPosts(1, true); }, [fetchPosts]);

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
          const next = page + 1; setPage(next); fetchPosts(next, false);
        }
      },
      { threshold: 0.1 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasMore, loadingMore, loading, page, fetchPosts]);

  return (
    <div style={{ background: 'var(--canvas)', paddingBottom: 88 }}>
      {viewingStory !== null && <StoryViewer stories={stories} startIndex={viewingStory} onClose={() => setViewingStory(null)} />}
      {appGate && <AppGateModal feature="Post Stories" onClose={() => setAppGate(false)} />}

      {/* Guest hero */}
      {!loggedIn && (
        <div style={{ maxWidth: 640, margin: '0 auto', padding: '28px 16px 20px' }}>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: 'var(--text)', lineHeight: 1.18, letterSpacing: '-0.5px', marginBottom: 6 }}>
            Connect. Care.<br />Celebrate Gau Seva.
          </h1>
          <p style={{ fontSize: 13.5, color: 'var(--text-muted)', marginBottom: 18, lineHeight: 1.55 }}>
            Join thousands of gaushala owners, vets &amp; gau-seva volunteers across India.
          </p>
          <div style={{ display: 'flex', gap: 10 }}>
            <Link href="/register" style={{ padding: '10px 22px', borderRadius: 100, background: 'var(--primary)', color: 'white', fontSize: 13.5, fontWeight: 700, textDecoration: 'none' }}>Get Started</Link>
            <Link href="/login" style={{ padding: '10px 20px', borderRadius: 100, border: '1.5px solid var(--border)', color: 'var(--text)', fontSize: 13.5, fontWeight: 600, textDecoration: 'none' }}>Login</Link>
          </div>
        </div>
      )}

      <div style={{ maxWidth: 640, margin: '0 auto', padding: '16px 16px 0' }}>
        {/* Stories strip */}
        <StoryStrip stories={stories} onStoryClick={(i) => setViewingStory(i)} onAddStory={() => setAppGate(true)} />

        {/* Filter chips */}
        <div className="scrollbar-hide" style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4, marginBottom: 16 }}>
          {FILTERS.map((f) => (
            <button key={f.value} onClick={() => setActiveFilter(f.value)} className={`filter-pill${activeFilter === f.value ? ' active' : ''}`}>
              {f.label}
            </button>
          ))}
        </div>

        {/* Skeletons */}
        {loading && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <SkeletonCard /><SkeletonCard /><SkeletonCard />
          </div>
        )}

        {/* Empty state */}
        {!loading && filteredPosts.length === 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '72px 24px', textAlign: 'center' }}>
            <div style={{ width: 96, height: 96, borderRadius: '50%', background: 'linear-gradient(135deg, var(--primary-light), #FFF9F3)', border: '2px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
              <Leaf size={40} color="var(--primary)" />
            </div>
            <h3 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text)', marginBottom: 8, letterSpacing: '-0.3px' }}>Nothing here yet</h3>
            <p style={{ fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.6, maxWidth: 260 }}>Be the first to share something with the Gau seva community.</p>
            <div style={{ marginTop: 20, display: 'flex', gap: 6, opacity: 0.5 }}>
              <Flame size={22} color="var(--primary)" />
            </div>
          </div>
        )}

        {/* Rescue alert banner — shows above posts when an active case exists */}
        {latestRescue && (
          <Link href="/rescue" style={{ textDecoration: 'none', display: 'block', marginBottom: 12 }}>
            <div style={{ background: 'linear-gradient(135deg, #7F0000 0%, #E53935 100%)', borderRadius: 14, overflow: 'hidden', display: 'flex', alignItems: 'stretch' }}>
              {(latestRescue.images?.[0] ?? latestRescue.photoUrl) && (
                <img src={latestRescue.images?.[0] ?? latestRescue.photoUrl} alt="" style={{ width: 90, objectFit: 'cover', flexShrink: 0 }} />
              )}
              <div style={{ padding: '12px 14px', flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 5 }}>
                  <span style={{ background: 'white', color: '#C0392B', fontSize: 9, fontWeight: 900, letterSpacing: 1.2, padding: '2px 6px', borderRadius: 4 }}>SOS</span>
                  <span style={{ color: 'white', fontSize: 12, fontWeight: 800, letterSpacing: 1 }}>RESCUE ALERT</span>
                  {latestRescue.type && (
                    <span style={{ marginLeft: 'auto', background: 'rgba(255,255,255,0.2)', color: 'white', fontSize: 10, fontWeight: 600, padding: '2px 10px', borderRadius: 20 }}>🩹 {latestRescue.type}</span>
                  )}
                </div>
                <p style={{ color: 'rgba(255,255,255,0.9)', fontSize: 12.5, lineHeight: 1.4, margin: 0 }}>
                  {latestRescue.reporter?.fullname ?? 'Someone'} reported {latestRescue.type?.toLowerCase() ?? 'an animal'} needing help{latestRescue.city ? ` · ${latestRescue.city}` : ''}
                </p>
                <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 10.5, marginTop: 4 }}>{timeAgo(latestRescue.createdAt)} · Tap to view</p>
              </div>
            </div>
          </Link>
        )}

        {/* Posts — gap 8px (Flutter: vertical: 8 margin) */}
        {!loading && filteredPosts.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {filteredPosts.map((post, i) => (
              <PostCard key={post.id ?? i} post={post} onInteract={() => setAppGate(true)} />
            ))}
          </div>
        )}

        {/* Infinite scroll sentinel */}
        <div ref={loaderRef} style={{ height: 48, display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: 8 }}>
          {loadingMore && (
            <div style={{ width: 24, height: 24, borderRadius: '50%', border: '2.5px solid var(--border)', borderTopColor: 'var(--primary)', animation: 'spin 0.7s linear infinite' }} />
          )}
        </div>
      </div>

      {/* FAB — create post (Flutter: 58px, brand gradient, bottom-right) */}
      <button
        onClick={() => setAppGate(true)}
        style={{
          position: 'fixed', bottom: 74, right: 12,
          width: 58, height: 58, borderRadius: '50%',
          background: 'linear-gradient(135deg, #F9A84D 0%, #F07B1D 50%, #E65C00 100%)',
          border: 'none', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 8px 20px -4px rgba(240,123,29,0.42)',
          zIndex: 30,
          transition: 'transform 0.12s, box-shadow 0.12s',
        }}
        onMouseDown={e => { (e.currentTarget).style.transform = 'scale(0.93)'; }}
        onMouseUp={e => { (e.currentTarget).style.transform = ''; }}
        onMouseLeave={e => { (e.currentTarget).style.transform = ''; }}
        aria-label="Create post"
      >
        <Plus size={30} color="white" strokeWidth={2.5} />
      </button>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
