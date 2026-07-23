'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { marketApi, feedApi } from '@/lib/api';
import {
  ShoppingBag, Search, ChevronLeft, ChevronRight,
  MessageCircle, Package, X, Layers, Heart, Flame,
} from 'lucide-react';

interface Banner {
  id?: string;
  imageUrl?: string;
  image?: string;
  title?: string;
}

interface Category {
  id?: string | number;
  name?: string;
  value?: string;
  icon?: string;
}

interface Product {
  id: string;
  name: string;
  price: number;
  discountPrice?: number;
  images: string[];
  unit?: string;
  vendorId: string;
  User?: { fullname?: string; businessName?: string };
  distance?: number;
}

interface FeedPost {
  id: string;
  content?: string;
  caption?: string;
  images?: string[];
  imageUrls?: string[];
  imageUrl?: string;
  createdAt: string;
  postType?: string;
  userId?: string;
  User?: { id?: string; fullname: string; profilePhoto?: string };
  user?: { id?: string; fullname: string; profilePhoto?: string };
  _count?: { likes: number };
  likesCount?: number;
}

function timeAgo(date: string): string {
  const diff = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

// Category color palettes — cycles through these
const CAT_COLORS = [
  { bg: '#FFF3E8', accent: '#F07B1D' },
  { bg: '#FEF3C7', accent: '#B45309' },
  { bg: '#E8F4FD', accent: '#1E6EAB' },
  { bg: '#F0FDF4', accent: '#15803D' },
  { bg: '#FDF2F8', accent: '#9333EA' },
  { bg: '#FFF1F2', accent: '#BE123C' },
  { bg: '#ECFDF5', accent: '#059669' },
  { bg: '#EFF6FF', accent: '#1D4ED8' },
];

export default function MarketPage() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [updates, setUpdates] = useState<FeedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [draftSearch, setDraftSearch] = useState('');
  const [selectedCat, setSelectedCat] = useState('');
  const [selectedCatLabel, setSelectedCatLabel] = useState('');
  const [sort, setSort] = useState('');
  const [totalItems, setTotalItems] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [bannerIdx, setBannerIdx] = useState(0);
  const [showAllCats, setShowAllCats] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => setUserCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => {},
      { timeout: 8000 }
    );
  }, []);

  /* ── Bootstrap ── */
  useEffect(() => {
    marketApi.getMarketBanners()
      .then((res) => {
        const raw = res.data?.data ?? res.data ?? [];
        setBanners(Array.isArray(raw) ? raw : []);
      }).catch(() => {});

    marketApi.getCategories()
      .then((res) => {
        const raw = res.data?.data ?? res.data ?? {};
        const list: Category[] = Array.isArray(raw.product_category)
          ? raw.product_category
          : Array.isArray(raw.categories) ? raw.categories
          : Array.isArray(raw) ? raw : [];
        setCategories(list.slice(0, 32));
      }).catch(() => {});

    // Fetch recent community updates
    feedApi.getPosts(1, 8)
      .then((res) => {
        const raw = res.data;
        let list: FeedPost[] = [];
        if (Array.isArray(raw)) list = raw;
        else if (Array.isArray(raw?.data?.posts)) list = raw.data.posts;
        else if (Array.isArray(raw?.data)) list = raw.data;
        else if (Array.isArray(raw?.posts)) list = raw.posts;
        setUpdates(list.filter((p) => p.postType?.toLowerCase() !== 'story' && (p.imageUrls?.[0] ?? p.images?.[0] ?? p.imageUrl)).slice(0, 8));
      }).catch(() => {});
  }, []);

  /* ── Banner autoplay ── */
  useEffect(() => {
    if (banners.length < 2) return;
    timerRef.current = setInterval(() => setBannerIdx((i) => (i + 1) % banners.length), 4000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [banners.length]);

  const stopAutoplay = () => { if (timerRef.current) clearInterval(timerRef.current); };
  const prevBanner = () => { stopAutoplay(); setBannerIdx((i) => (i - 1 + banners.length) % banners.length); };
  const nextBanner = () => { stopAutoplay(); setBannerIdx((i) => (i + 1) % banners.length); };

  /* ── Products ── */
  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, unknown> = { page, limit: 12 };
      if (search) params.search = search;
      if (selectedCat) params.category = selectedCat;
      if (sort === 'price_asc') { params.sortBy = 'price'; params.sortOrder = 'asc'; }
      if (sort === 'price_desc') { params.sortBy = 'price'; params.sortOrder = 'desc'; }
      if (userCoords) { params.lat = userCoords.lat; params.lng = userCoords.lng; }
      const res = await marketApi.getProducts(params);
      const payload = res.data?.data ?? res.data ?? {};
      const list: Product[] = Array.isArray(payload) ? payload : (payload.data ?? []);
      setProducts(list);
      setTotalPages(payload.totalPages ?? payload.pages ?? 1);
      setTotalItems(payload.totalItems ?? payload.total ?? payload.count ?? list.length);
    } catch {
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [page, search, selectedCat, sort, userCoords]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  const handleSearch = (e: React.FormEvent) => { e.preventDefault(); setSearch(draftSearch); setPage(1); };
  const clearSearch = () => { setDraftSearch(''); setSearch(''); setPage(1); };
  const handleSort = (val: string) => { setSort(val); setPage(1); };
  const selectCat = (key: string, label: string) => {
    if (selectedCat === key) { setSelectedCat(''); setSelectedCatLabel(''); }
    else { setSelectedCat(key); setSelectedCatLabel(label); }
    setPage(1);
  };

  const catKey = (c: Category) => String(c.id ?? c.name ?? '');
  const catLabel = (c: Category) => c.value ?? c.name ?? String(c.id ?? '');
  const productSrc = (p: Product) => p.images?.[0] ?? '';
  const vendorName = (p: Product) => p.User?.businessName ?? p.User?.fullname ?? 'Vendor';
  const bannerSrc = (b: Banner) => b.imageUrl ?? b.image ?? '';

  const visibleCats = showAllCats ? categories : categories.slice(0, 12);

  const pageRange = (): (number | '…')[] => {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
    if (page <= 4) return [1, 2, 3, 4, 5, '…', totalPages];
    if (page >= totalPages - 3) return [1, '…', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
    return [1, '…', page - 1, page, page + 1, '…', totalPages];
  };

  return (
    <div style={{ background: 'var(--canvas)', minHeight: '100vh', paddingBottom: 80 }}>
      <div className="max-w-6xl mx-auto px-4 py-6">

        {/* ── Banner carousel ── */}
        {banners.length > 0 && (
          <div className="relative rounded-2xl overflow-hidden mb-6" style={{ height: 220, background: 'var(--primary-light)' }}>
            <div className="flex h-full" style={{ width: `${banners.length * 100}%`, transform: `translateX(-${bannerIdx * (100 / banners.length)}%)`, transition: 'transform 0.5s ease' }}>
              {banners.map((b, i) => (
                <div key={b.id ?? i} className="h-full flex-shrink-0 relative" style={{ width: `${100 / banners.length}%` }}>
                  {bannerSrc(b)
                    ? <img src={bannerSrc(b)} alt={b.title ?? ''} className="w-full h-full object-cover" />
                    : <div className="w-full h-full flex flex-col items-center justify-center gap-3"><ShoppingBag size={48} className="opacity-30" style={{ color: 'var(--primary)' }} />{b.title && <p className="font-semibold text-lg" style={{ color: 'var(--brown)' }}>{b.title}</p>}</div>
                  }
                </div>
              ))}
            </div>
            {banners.length > 1 && (
              <>
                <button onClick={prevBanner} className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/80 backdrop-blur flex items-center justify-center shadow-sm hover:bg-white transition-colors"><ChevronLeft size={18} /></button>
                <button onClick={nextBanner} className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/80 backdrop-blur flex items-center justify-center shadow-sm hover:bg-white transition-colors"><ChevronRight size={18} /></button>
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                  {banners.map((_, i) => (
                    <button key={i} onClick={() => { stopAutoplay(); setBannerIdx(i); }} className="h-2 rounded-full transition-all duration-300" style={{ width: i === bannerIdx ? 20 : 8, background: i === bannerIdx ? 'white' : 'rgba(255,255,255,0.5)' }} />
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* ── Search ── */}
        <form onSubmit={handleSearch} className="mb-6">
          <div className="relative flex gap-2">
            <div className="relative flex-1">
              <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--text-muted)' }} />
              <input className="input" style={{ paddingLeft: 44, paddingRight: draftSearch ? 36 : 14 }} placeholder="Search gau products…" value={draftSearch} onChange={(e) => setDraftSearch(e.target.value)} />
              {draftSearch && (
                <button type="button" onClick={clearSearch} className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }}><X size={16} /></button>
              )}
            </div>
            <button type="submit" className="btn-primary px-5 py-3">Search</button>
          </div>
        </form>

        {/* ── Categories grid ── */}
        {categories.length > 0 && (
          <div style={{ marginBottom: 28 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <h2 style={{ fontSize: 17, fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.3px' }}>
                {selectedCat ? (
                  <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ color: 'var(--text-muted)', fontWeight: 500, fontSize: 14 }}>Category:</span>
                    <span style={{ color: 'var(--primary)' }}>{selectedCatLabel}</span>
                    <button onClick={() => { setSelectedCat(''); setSelectedCatLabel(''); setPage(1); }} style={{ background: 'var(--primary-light)', border: 'none', color: 'var(--primary)', borderRadius: '50%', width: 20, height: 20, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <X size={11} />
                    </button>
                  </span>
                ) : 'Browse Categories'}
              </h2>
              {categories.length > 12 && (
                <button onClick={() => setShowAllCats(!showAllCats)} style={{ fontSize: 13, fontWeight: 600, color: 'var(--primary)', background: 'none', border: 'none', cursor: 'pointer' }}>
                  {showAllCats ? 'Show less' : `View all (${categories.length})`}
                </button>
              )}
            </div>

            <div className="cat-grid">
              {visibleCats.map((cat, i) => {
                const key = catKey(cat);
                const label = catLabel(cat);
                const active = selectedCat === key;
                const colors = CAT_COLORS[i % CAT_COLORS.length];
                return (
                  <button
                    key={cat.id ?? i}
                    onClick={() => selectCat(key, label)}
                    style={{
                      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
                      padding: '12px 8px', borderRadius: 14, cursor: 'pointer', border: 'none',
                      transition: 'all 0.15s', textAlign: 'center',
                      ...(active
                        ? { background: 'var(--primary)', boxShadow: '0 4px 14px rgba(240,123,29,0.3)' }
                        : { background: colors.bg }),
                    }}
                  >
                    <div style={{
                      width: 42, height: 42, borderRadius: 12,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      background: active ? 'rgba(255,255,255,0.2)' : 'white',
                      boxShadow: active ? 'none' : '0 1px 4px rgba(0,0,0,0.06)',
                    }}>
                      <Layers size={18} color={active ? 'white' : colors.accent} />
                    </div>
                    <span style={{
                      fontSize: 11, fontWeight: 600, lineHeight: 1.3,
                      color: active ? 'white' : 'var(--text)',
                      overflow: 'hidden', display: '-webkit-box',
                      WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
                    }}>
                      {label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Community Updates strip ── */}
        {updates.length > 0 && !selectedCat && !search && (
          <div style={{ marginBottom: 28 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <Flame size={16} color="var(--primary)" />
              <h2 style={{ fontSize: 17, fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.3px' }}>Community Updates</h2>
            </div>
            <div
              className="scrollbar-hide"
              style={{ display: 'flex', gap: 12, overflowX: 'auto', paddingBottom: 4, marginLeft: -16, marginRight: -16, paddingLeft: 16, paddingRight: 16 }}
            >
              {updates.map((post) => {
                const author = post.User ?? post.user;
                const img = post.imageUrls?.[0] ?? post.images?.[0] ?? post.imageUrl;
                const text = post.content ?? post.caption ?? '';
                const likes = post._count?.likes ?? post.likesCount ?? 0;
                return (
                  <div
                    key={post.id}
                    className="card"
                    style={{ flexShrink: 0, width: 220, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
                  >
                    {img && (
                      <div style={{ height: 120, overflow: 'hidden', flexShrink: 0 }}>
                        <img src={img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      </div>
                    )}
                    <div style={{ padding: '10px 12px 12px', flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {author && (() => {
                        const profileId = author.id ?? post.userId;
                        const inner = (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <div style={{ width: 22, height: 22, borderRadius: '50%', background: 'var(--primary-light)', overflow: 'hidden', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              {author.profilePhoto
                                ? <img src={author.profilePhoto} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                : <span style={{ fontSize: 9, fontWeight: 800, color: 'var(--primary)' }}>{author.fullname[0].toUpperCase()}</span>}
                            </div>
                            <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text)', textTransform: 'capitalize', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {author.fullname.toLowerCase()}
                            </span>
                          </div>
                        );
                        return profileId
                          ? <Link href={`/gaushala/${profileId}`} style={{ textDecoration: 'none' }}>{inner}</Link>
                          : inner;
                      })()}
                      {text && (
                        <p style={{ fontSize: 12.5, color: 'var(--text)', lineHeight: 1.5, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical' }}>
                          {text}
                        </p>
                      )}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto' }}>
                        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{timeAgo(post.createdAt)}</span>
                        {likes > 0 && (
                          <span style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 11, color: 'var(--text-muted)' }}>
                            <Heart size={11} /> {likes}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Section heading + Sort & Filter ── */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, gap: 12, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <h2 style={{ fontSize: 17, fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.3px' }}>
              {selectedCat ? `${selectedCatLabel} Products` : search ? `Results for "${search}"` : 'All Products'}
            </h2>
            {totalItems > 0 && !loading && (
              <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', background: 'var(--surface)', border: '1.5px solid var(--border)', borderRadius: 100, padding: '2px 10px' }}>
                {totalItems} items
              </span>
            )}
          </div>
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <select
              className="input"
              value={sort}
              onChange={(e) => handleSort(e.target.value)}
              style={{ paddingRight: 32, paddingLeft: 12, paddingTop: 8, paddingBottom: 8, appearance: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600, borderRadius: 10 }}
            >
              <option value="">Newest</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
            </select>
            <ChevronRight size={13} style={{ position: 'absolute', right: 9, top: '50%', transform: 'translateY(-50%) rotate(90deg)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
          </div>
        </div>

        {/* ── Product grid ── */}
        {loading ? (
          <div className="product-grid">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="card">
                <div className="skeleton aspect-square w-full" />
                <div className="p-3 space-y-2">
                  <div className="skeleton h-4 w-3/4" />
                  <div className="skeleton h-3 w-1/2" />
                  <div className="skeleton h-4 w-1/3 mt-1" />
                  <div className="skeleton h-9 w-full mt-2" />
                </div>
              </div>
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-24">
            <Package size={52} className="mx-auto mb-4" style={{ color: 'var(--border)' }} />
            <p className="font-semibold text-lg" style={{ color: 'var(--text-muted)' }}>No products found</p>
            <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
              {search || selectedCat ? 'Try a different search or category.' : 'Check back soon!'}
            </p>
            {(search || selectedCat) && (
              <button className="btn-outline mt-4 text-sm py-2 px-5" onClick={() => { clearSearch(); setSelectedCat(''); setSelectedCatLabel(''); }}>
                Clear filters
              </button>
            )}
          </div>
        ) : (
          <div className="product-grid">
            {products.map((p) => {
              const hasDiscount = p.discountPrice != null && p.discountPrice < p.price;
              const discountPct = hasDiscount ? Math.round(((p.price - p.discountPrice!) / p.price) * 100) : 0;
              return (
                <div key={p.id} className="card card-hover flex flex-col group">
                  <Link href={`/market/${p.id}`} className="block">
                    <div style={{ height: 180, overflow: 'hidden', position: 'relative', background: 'var(--canvas)', flexShrink: 0 }}>
                      {productSrc(p)
                        ? <img src={productSrc(p)} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', transition: 'transform 0.3s' }} className="group-hover:scale-105" />
                        : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Package size={40} style={{ color: 'var(--border)' }} /></div>
                      }
                      {hasDiscount && discountPct > 0 && <span className="discount-badge">{discountPct}% OFF</span>}
                    </div>
                    <div className="p-3 pb-2">
                      <p style={{ fontWeight: 700, fontSize: 13.5, lineHeight: 1.4, color: 'var(--text)', letterSpacing: '-0.1px' }} className="line-clamp-2">{p.name}</p>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 2, flexWrap: 'wrap' }}>
                        <p style={{ fontSize: 11.5, color: 'var(--text-muted)', fontWeight: 500, margin: 0 }}>{vendorName(p)}</p>
                        {p.distance != null && (
                          <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--primary)', background: 'var(--primary-light)', borderRadius: 100, padding: '1px 6px', whiteSpace: 'nowrap' }}>
                            {p.distance < 1 ? `${Math.round(p.distance * 1000)} m` : p.distance < 10 ? `${p.distance.toFixed(1)} km` : `${Math.round(p.distance)} km`}
                          </span>
                        )}
                      </div>
                      <div className="flex items-baseline gap-1.5 mt-2 flex-wrap">
                        <span style={{ fontWeight: 800, fontSize: 16, color: 'var(--primary)', letterSpacing: '-0.3px' }}>₹{hasDiscount ? p.discountPrice : p.price}</span>
                        {hasDiscount && <span style={{ fontSize: 12, textDecoration: 'line-through', color: 'var(--text-muted)' }}>₹{p.price}</span>}
                        {p.unit && <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>/{p.unit}</span>}
                      </div>
                    </div>
                  </Link>
                  <div className="px-3 pb-3 mt-auto pt-1">
                    <Link href={`/market/${p.id}`} className="btn-primary w-full text-sm" style={{ padding: '9px 16px', borderRadius: 100, fontSize: 13 }}>
                      <MessageCircle size={13} /> Enquire
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ── Pagination ── */}
        {!loading && totalPages > 1 && (
          <div className="flex items-center justify-center gap-1.5 mt-10">
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="btn-outline py-2 px-3 disabled:opacity-40"><ChevronLeft size={16} /></button>
            {pageRange().map((n, i) =>
              n === '…' ? (
                <span key={`el-${i}`} className="px-1 text-sm" style={{ color: 'var(--text-muted)' }}>…</span>
              ) : (
                <button key={n} onClick={() => setPage(n as number)} className="w-9 h-9 rounded-lg text-sm font-semibold transition-colors border" style={page === n ? { background: 'var(--primary)', color: 'white', border: '1.5px solid var(--primary)' } : { background: 'var(--surface)', color: 'var(--text-muted)', border: '1.5px solid var(--border)' }}>{n}</button>
              )
            )}
            <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="btn-outline py-2 px-3 disabled:opacity-40"><ChevronRight size={16} /></button>
          </div>
        )}
      </div>

      <style>{`
        .cat-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; }
        .product-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; align-items: start; }
        @media (min-width: 480px) { .cat-grid { grid-template-columns: repeat(5, 1fr); } .product-grid { grid-template-columns: repeat(3, 1fr); } }
        @media (min-width: 640px) { .cat-grid { grid-template-columns: repeat(6, 1fr); } .product-grid { grid-template-columns: repeat(3, 1fr); } }
        @media (min-width: 900px) { .product-grid { grid-template-columns: repeat(4, 1fr); } }
        @media (min-width: 1024px) { .cat-grid { grid-template-columns: repeat(8, 1fr); } .product-grid { grid-template-columns: repeat(4, 1fr); } }
      `}</style>
    </div>
  );
}
