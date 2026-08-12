'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { expertApi } from '@/lib/api';
import toast from 'react-hot-toast';
import { Search, Star, MapPin, Users, ChevronLeft, ChevronRight, X, BadgeCheck } from 'lucide-react';

/* ─── Types ──────────────────────────────────────────────────────────────── */

interface ExpertProfile {
  specialization?: string;
  experience?: number;
  bio?: string;
}

interface Expert {
  id: string;
  fullname?: string;
  businessName?: string;
  profilePhoto?: string;
  state?: string;
  district?: string;
  avgRating?: number;
  reviewCount?: number;
  followers_count?: number;
  isVerified?: boolean;
  AppUserProfiles?: ExpertProfile[];
}

interface Banner {
  id?: string;
  imageUrl?: string;
  image?: string;
  title?: string;
}

/* ─── Helpers ────────────────────────────────────────────────────────────── */

const BACKEND = process.env.NEXT_PUBLIC_API_URL ?? 'https://app.gaubook.org';
function resolveImg(url?: string | null): string {
  if (!url) return '';
  if (url.startsWith('http')) return url;
  if (url.startsWith('/')) return `${BACKEND}${url}`;
  return url;
}
const bannerSrc = (b: Banner) => resolveImg(b.imageUrl ?? b.image);
const expertName = (e: Expert) => e.businessName ?? e.fullname ?? 'Expert';

/* ─── Skeleton card ─────────────────────────────────────────────────────── */

function SkeletonCard() {
  return (
    <div style={{
      background: 'var(--surface)', borderRadius: 20, padding: 12,
      border: '1px solid var(--border)', boxShadow: 'var(--shadow-card)',
      display: 'flex', gap: 12,
    }}>
      <div className="skeleton" style={{ width: 72, height: 72, borderRadius: 12, flexShrink: 0 }} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
        <div className="skeleton" style={{ height: 14, width: '70%', borderRadius: 6 }} />
        <div className="skeleton" style={{ height: 11, width: '50%', borderRadius: 6 }} />
        <div className="skeleton" style={{ height: 11, width: '80%', borderRadius: 6 }} />
        <div style={{ display: 'flex', gap: 6, marginTop: 2 }}>
          <div className="skeleton" style={{ height: 20, width: 64, borderRadius: 999 }} />
        </div>
      </div>
    </div>
  );
}

/* ─── Expert card (Flutter: horizontal row, no buttons) ─────────────────── */

function ExpertCard({ expert }: { expert: Expert }) {
  const [imgErr, setImgErr] = useState(false);
  const name    = expertName(expert);
  const profile = expert.AppUserProfiles?.[0];
  const initials = name[0]?.toUpperCase() ?? 'E';
  const src      = resolveImg(expert.profilePhoto);
  const location = [expert.district, expert.state].filter(Boolean).join(', ');
  const rating   = expert.avgRating ?? 0;
  const reviews  = expert.reviewCount ?? 0;
  const followers = expert.followers_count ?? 0;
  const exp      = profile?.experience ?? 0;
  const spec     = profile?.specialization ?? '';

  return (
    <Link
      href={`/expert/${expert.id}`}
      style={{ textDecoration: 'none', display: 'block' }}
    >
      <div style={{
        background: 'var(--surface)', borderRadius: 20, padding: 12,
        border: '1px solid var(--border)', boxShadow: 'var(--shadow-card)',
        display: 'flex', gap: 12, alignItems: 'flex-start',
        transition: 'box-shadow 0.2s, transform 0.2s',
      }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLDivElement).style.boxShadow = 'var(--shadow-lifted)';
          (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-1px)';
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLDivElement).style.boxShadow = 'var(--shadow-card)';
          (e.currentTarget as HTMLDivElement).style.transform = '';
        }}
      >
        {/* Avatar — 72×72, 12px radius, no ring (Flutter spec) */}
        <div style={{ flexShrink: 0 }}>
          {src && !imgErr ? (
            <img
              src={src}
              alt={name}
              onError={() => setImgErr(true)}
              style={{ width: 72, height: 72, borderRadius: 12, objectFit: 'cover', display: 'block' }}
            />
          ) : (
            <div style={{
              width: 72, height: 72, borderRadius: 12,
              background: 'var(--warm-tint)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 800, fontSize: 24, color: 'var(--primary)',
            }}>
              {initials}
            </div>
          )}
        </div>

        {/* Info column */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Name */}
          <p style={{
            fontSize: 15, fontWeight: 500, color: 'var(--text)',
            lineHeight: 1.25, letterSpacing: '-0.1px',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            textTransform: 'capitalize',
          }}>
            {name}
          </p>

          {/* Specialization (if any) */}
          {spec && (
            <p style={{ fontSize: 11, fontWeight: 500, color: 'var(--text-muted)', marginTop: 1, marginBottom: 2 }}>
              {spec}
            </p>
          )}

          {/* Location */}
          {location && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 3, marginTop: 2 }}>
              <MapPin size={11} color="var(--text-muted)" style={{ flexShrink: 0 }} />
              <span style={{
                fontSize: 11, color: 'var(--text-muted)', letterSpacing: '0.2px',
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}>
                {location}
              </span>
            </div>
          )}

          {/* Rating + followers row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 6, flexWrap: 'wrap' }}>
            <Star size={14} fill="#C9A227" color="#C9A227" />
            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text)', lineHeight: 1 }}>
              {rating > 0 ? rating.toFixed(1) : '—'}
            </span>
            <span style={{ fontSize: 11, color: 'var(--text-muted)', lineHeight: 1 }}>
              ({reviews})
            </span>
            {followers > 0 && (
              <>
                <span style={{ fontSize: 11, color: 'var(--border)', lineHeight: 1, marginLeft: 2 }}>·</span>
                <Users size={13} color="var(--text-muted)" style={{ flexShrink: 0 }} />
                <span style={{ fontSize: 11, color: 'var(--text-muted)', lineHeight: 1 }}>
                  {followers.toLocaleString()}
                </span>
              </>
            )}
          </div>

          {/* Badge pills: experience + verified */}
          {(exp > 0 || expert.isVerified) && (
            <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
              {exp > 0 && (
                <span style={{
                  fontSize: 11, fontWeight: 600, color: 'var(--primary)',
                  background: 'rgba(240,123,29,0.10)',
                  borderRadius: 999, padding: '4px 10px', lineHeight: 1,
                }}>
                  {exp} Yrs Exp
                </span>
              )}
              {expert.isVerified && (
                <span style={{
                  display: 'flex', alignItems: 'center', gap: 3,
                  fontSize: 11, fontWeight: 600, color: '#C9A227',
                  background: 'rgba(201,162,39,0.10)',
                  borderRadius: 999, padding: '4px 10px', lineHeight: 1,
                }}>
                  <BadgeCheck size={12} color="#C9A227" />
                  Verified
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}

/* ─── Page ───────────────────────────────────────────────────────────────── */

export default function ExpertPage() {
  const [experts, setExperts]       = useState<Expert[]>([]);
  const [banners, setBanners]       = useState<Banner[]>([]);
  const [draftSearch, setDraftSearch] = useState('');
  const [search, setSearch]         = useState('');
  const [page, setPage]             = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [loading, setLoading]       = useState(true);
  const [bannerIdx, setBannerIdx]   = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  /* Banners */
  useEffect(() => {
    expertApi.getBanners()
      .then((r) => {
        const list = r.data?.data ?? r.data?.banners ?? r.data ?? [];
        setBanners(Array.isArray(list) ? list : []);
      }).catch(() => {});
  }, []);

  /* Banner autoplay */
  useEffect(() => {
    if (banners.length < 2) return;
    timerRef.current = setInterval(() => setBannerIdx((i) => (i + 1) % banners.length), 4000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [banners.length]);

  const stopAutoplay = () => { if (timerRef.current) clearInterval(timerRef.current); };
  const prevBanner   = () => { stopAutoplay(); setBannerIdx((i) => (i - 1 + banners.length) % banners.length); };
  const nextBanner   = () => { stopAutoplay(); setBannerIdx((i) => (i + 1) % banners.length); };

  /* Experts */
  const fetchExperts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await expertApi.getExperts({ page, limit: 15, ...(search ? { search } : {}) });
      const d     = res.data;
      const inner = d?.data ?? d;
      const list  = inner?.gaushalas ?? inner?.users ?? (Array.isArray(inner) ? inner : []);
      setExperts(Array.isArray(list) ? list : []);
      setTotalPages(inner?.totalPages ?? d?.totalPages ?? (inner?.total ? Math.ceil(inner.total / 15) : 1));
      setTotalItems(inner?.total ?? inner?.totalItems ?? (Array.isArray(list) ? list.length : 0));
    } catch {
      setExperts([]);
      toast.error('Failed to load experts. Try again.');
    }
    setLoading(false);
  }, [page, search]);

  /* debounce search */
  useEffect(() => {
    const timeoutId = setTimeout(() => { setPage(1); }, 400);
    return () => clearTimeout(timeoutId);
  }, [search]);

  useEffect(() => {
    const timeoutId = setTimeout(fetchExperts, 400);
    return () => clearTimeout(timeoutId);
  }, [fetchExperts, draftSearch, search]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(draftSearch);
    setPage(1);
  };
  const clearSearch = () => { setDraftSearch(''); setSearch(''); setPage(1); };

  return (
    <div style={{ background: 'var(--canvas)', minHeight: '100vh', paddingBottom: 80 }}>

      {/* ── Banner carousel (Flutter: 140px, 20px radius, warm shadow) ── */}
      {banners.length > 0 && (
        <div style={{ padding: '8px 12px 0' }}>
          <div style={{ position: 'relative', height: 140, borderRadius: 20, overflow: 'hidden', background: 'var(--warm-tint)', boxShadow: 'var(--shadow-card)' }}>
            <div style={{
              display: 'flex', height: '100%',
              width: `${banners.length * 100}%`,
              transform: `translateX(-${bannerIdx * (100 / banners.length)}%)`,
              transition: 'transform 0.42s cubic-bezier(0.33,1,0.68,1)',
            }}>
              {banners.map((b, i) => (
                <div key={b.id ?? i} style={{ height: '100%', flexShrink: 0, width: `${100 / banners.length}%` }}>
                  {bannerSrc(b)
                    ? <img src={bannerSrc(b)} alt={b.title ?? ''} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                    : b.title && <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', padding: 16 }}><p style={{ fontWeight: 600, color: 'var(--brown)', textAlign: 'center' }}>{b.title}</p></div>
                  }
                </div>
              ))}
            </div>
            {banners.length > 1 && (
              <>
                <button onClick={prevBanner} style={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)', width: 28, height: 28, borderRadius: '50%', background: 'rgba(255,255,255,0.85)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <ChevronLeft size={16} />
                </button>
                <button onClick={nextBanner} style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', width: 28, height: 28, borderRadius: '50%', background: 'rgba(255,255,255,0.85)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <ChevronRight size={16} />
                </button>
                {/* Flutter dots: active 18×4 orange, inactive 6×4 #EFE7DC */}
                <div style={{ position: 'absolute', bottom: 10, left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: 6, alignItems: 'center' }}>
                  {banners.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => { stopAutoplay(); setBannerIdx(i); }}
                      style={{
                        height: 4, borderRadius: 999, border: 'none', cursor: 'pointer', padding: 0,
                        transition: 'all 0.26s cubic-bezier(0.33,1,0.68,1)',
                        width: i === bannerIdx ? 18 : 6,
                        background: i === bannerIdx ? '#F07B1D' : '#EFE7DC',
                      }}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* ── Search bar ── */}
      <div style={{ padding: '12px 12px 0', maxWidth: 680, margin: '0 auto' }}>
        <form onSubmit={handleSearch} style={{ display: 'flex', gap: 8 }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={16} style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
            <input
              className="input"
              placeholder="Search gau experts…"
              value={draftSearch}
              onChange={(e) => setDraftSearch(e.target.value)}
              style={{ paddingLeft: 40, paddingRight: draftSearch ? 36 : 14, fontSize: 14 }}
            />
            {draftSearch && (
              <button type="button" onClick={clearSearch} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                <X size={15} />
              </button>
            )}
          </div>
          <button type="submit" className="btn-primary" style={{ padding: '0 18px', borderRadius: 12, fontSize: 14, flexShrink: 0 }}>
            Search
          </button>
        </form>

        {/* Item count / active search chip */}
        {(!loading && (totalItems > 0 || search)) && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
            {totalItems > 0 && (
              <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--brown)', background: 'var(--warm-tint)', border: '1px solid var(--border)', borderRadius: 999, padding: '3px 10px' }}>
                {totalItems} experts
              </span>
            )}
            {search && (
              <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 600, color: 'var(--primary)', background: 'rgba(240,123,29,0.08)', border: '1px solid rgba(240,123,29,0.2)', borderRadius: 999, padding: '3px 8px' }}>
                "{search}"
                <button onClick={clearSearch} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--primary)', padding: 0, display: 'flex', lineHeight: 1 }}>
                  <X size={10} />
                </button>
              </span>
            )}
          </div>
        )}
      </div>

      {/* ── Expert list ── */}
      <div style={{ maxWidth: 680, margin: '0 auto', padding: '12px 12px 0' }}>
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : experts.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', paddingTop: 72, textAlign: 'center' }}>
            <div style={{ width: 88, height: 88, borderRadius: '50%', background: 'var(--warm-tint)', border: '2px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
              <Search size={36} color="var(--primary)" strokeWidth={1.5} />
            </div>
            <h3 style={{ fontSize: 17, fontWeight: 700, color: 'var(--text)', marginBottom: 6 }}>No experts found</h3>
            <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
              {search ? 'Try a different search term.' : 'Check back soon!'}
            </p>
            {search && (
              <button onClick={clearSearch} className="btn-outline" style={{ marginTop: 16, fontSize: 13, padding: '8px 20px' }}>
                Clear search
              </button>
            )}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
            {experts.map((e) => <ExpertCard key={e.id} expert={e} />)}
          </div>
        )}

        {/* Pagination */}
        {!loading && totalPages > 1 && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 24, marginBottom: 8 }}>
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="btn-outline"
              style={{ padding: '8px 14px', fontSize: 13 }}
            >
              <ChevronLeft size={16} />
            </button>
            <span style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 500, padding: '0 8px' }}>
              {page} / {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="btn-primary"
              style={{ padding: '8px 14px', fontSize: 13 }}
            >
              <ChevronRight size={16} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
