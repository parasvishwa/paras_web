'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { marketApi } from '@/lib/api';
import toast from 'react-hot-toast';
import {
  Search, ChevronLeft, ChevronRight,
  Package, X, Store, Plus, SlidersHorizontal, MapPin, Navigation,
  LayoutGrid, Flame, Droplets, Leaf, Sparkles, Wheat,
  Sprout, Utensils, Shirt, Wrench, Handshake, Star,
  PawPrint, BookOpen, Layers,
} from 'lucide-react';

/* ─── Subcategory icon mapping (mirrors Flutter _getCategoryIcon) ─────────── */
function getSubCatIcon(label: string): React.ElementType {
  const l = label.toLowerCase();
  if (l === 'all') return LayoutGrid;
  // Specific product types first (before generic "panchgavya" catch-all)
  if (l.includes('diya') || l.includes('lamp') || l.includes('samidha') || l.includes('stick') || l.includes('agarbatti') || l.includes('dhoop') || l.includes('incense') || l.includes('havan')) return Flame;
  if (l.includes('ghee') || l.includes('ghrita') || l.includes('milk') || l.includes('dairy') || l.includes('doodh')) return Droplets;
  if (l.includes('soap') || l.includes('sanitizer') || l.includes('wellness') || l.includes('cosm') || l.includes('beauty') || l.includes('lip') || l.includes('skin') || l.includes('lotion')) return Sparkles;
  if (l.includes('medicine') || l.includes('ayur') || l.includes('herb') || l.includes('health')) return Leaf;
  if (l.includes('gomaye') || l.includes('gobar') || l.includes('bhasma') || l.includes('farm') || l.includes('agri') || l.includes('organic') || l.includes('fertilizer')) return Sprout;
  if (l.includes('akshata') || l.includes('grain') || l.includes('rice') || l.includes('samagri') || l.includes('puja') || l.includes('pooja') || l.includes('spiritual') || l.includes('devotional') || l.includes('mantra') || l.includes('ganesh')) return Star;
  if (l.includes('food') || l.includes('grocery') || l.includes('eat') || l.includes('snack')) return Utensils;
  if (l.includes('animal') || l.includes('feed') || l.includes('fodder') || l.includes('cow') || l.includes('pet')) return PawPrint;
  if (l.includes('cloth') || l.includes('wear') || l.includes('apparel') || l.includes('dress')) return Shirt;
  if (l.includes('equip') || l.includes('infra') || l.includes('tool')) return Wrench;
  if (l.includes('serv') || l.includes('consult')) return Handshake;
  if (l.includes('book') || l.includes('station')) return BookOpen;
  // Generic panchgavya products → wheat (sacred grain family)
  if (l.includes('panchgavya') || l.includes('gaumutra') || l.includes('cow')) return Wheat;
  return Layers;
}

/* ─── Types ──────────────────────────────────────────────────────────────── */

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
  isActive?: boolean;
}

interface SubCategory {
  id: string;
  value: string;
  parentId?: string | null;
  imageUrl?: string | null;
  isActive?: boolean;
}

interface Product {
  id: string;
  name: string;
  price: number;
  discountPrice?: number;
  imageUrl?: string;
  images?: string[];
  unit?: string;
  userId?: string;
  /* vendor fields returned directly on product from list endpoint */
  fullname?: string;
  businessName?: string;
  state?: string;
  district?: string;
  subcategory?: string;
  subcategoryId?: string;
  category?: string;
  categoryId?: string;
  /* nested user — detail endpoint */
  user?: { id?: string; fullname?: string; businessName?: string };
  User?: { id?: string; fullname?: string; businessName?: string };
  distance?: number;
  stock?: number;
}

/* ─── Helpers ────────────────────────────────────────────────────────────── */

const BACKEND = process.env.NEXT_PUBLIC_API_URL ?? 'https://app.gaubook.org';
function resolveImg(url?: string | null): string {
  if (!url) return '';
  if (url.startsWith('http')) return url;
  if (url.startsWith('/')) return `${BACKEND}${url}`;
  return url;
}

const productSrc  = (p: Product) => resolveImg(p.imageUrl ?? p.images?.[0]);
const vendorName  = (p: Product) =>
  p.businessName ?? p.fullname ??
  p.user?.businessName ?? p.user?.fullname ??
  p.User?.businessName ?? p.User?.fullname ?? 'Vendor';

const bannerSrc = (b: Banner) => resolveImg(b.imageUrl ?? b.image);
const catKey    = (c: Category) => String(c.id ?? c.name ?? '');
const catLabel  = (c: Category) => c.value ?? c.name ?? String(c.id ?? '');

/* ─── Skeleton card ─────────────────────────────────────────────────────── */

function SkeletonCard() {
  return (
    <div style={{
      background: 'var(--surface)', borderRadius: 16,
      border: '1px solid var(--border)', boxShadow: 'var(--shadow-card)',
      overflow: 'hidden',
    }}>
      {/* square image placeholder */}
      <div className="skeleton" style={{ paddingBottom: '100%', position: 'relative' }} />
      <div style={{ padding: 8, display: 'flex', flexDirection: 'column', gap: 6 }}>
        <div className="skeleton" style={{ height: 12, width: '80%', borderRadius: 6 }} />
        <div className="skeleton" style={{ height: 10, width: '55%', borderRadius: 6 }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
          <div className="skeleton" style={{ height: 14, width: '35%', borderRadius: 6 }} />
          <div className="skeleton" style={{ height: 26, width: 52, borderRadius: 999 }} />
        </div>
      </div>
    </div>
  );
}

/* ─── Product card ──────────────────────────────────────────────────────── */

function ProductCard({ p }: { p: Product }) {
  const [imgErr, setImgErr] = useState(false);
  const src        = productSrc(p);
  const hasDiscount = p.discountPrice != null && Number(p.discountPrice) < Number(p.price);
  const displayPrice = hasDiscount ? p.discountPrice! : p.price;
  const discountPct  = hasDiscount
    ? Math.round(((Number(p.price) - Number(p.discountPrice!)) / Number(p.price)) * 100)
    : 0;
  const seller = vendorName(p);

  return (
    <div style={{
      background: 'var(--surface)', borderRadius: 16,
      border: '1px solid var(--border)', boxShadow: 'var(--shadow-card)',
      overflow: 'hidden', display: 'flex', flexDirection: 'column',
    }}>
      {/* Square image */}
      <Link href={`/market/${p.id}`} style={{ display: 'block', position: 'relative', flexShrink: 0 }}>
        <div style={{
          paddingBottom: '100%', position: 'relative',
          background: 'var(--warm-tint)',
        }}>
          {src && !imgErr
            ? <Image
                src={src}
                alt={p.name}
                fill
                onError={() => setImgErr(true)}
                style={{ objectFit: 'cover' }}
              />
            : <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Package size={28} style={{ color: 'var(--border)' }} />
              </div>
          }
          {hasDiscount && discountPct > 0 && (
            <span className="discount-badge">{discountPct}% OFF</span>
          )}
        </div>
      </Link>

      {/* Info */}
      <div style={{ padding: 8, display: 'flex', flexDirection: 'column', gap: 3, flex: 1 }}>
        <p style={{
          fontSize: 11.5, fontWeight: 700, lineHeight: 1.25,
          color: 'var(--text)', letterSpacing: '-0.1px',
          display: '-webkit-box', WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical', overflow: 'hidden',
        }}>
          {p.name}
        </p>

        {/* Seller */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 3, minWidth: 0 }}>
          <Store size={10} color="#A0622A" style={{ flexShrink: 0 }} />
          <span style={{
            fontSize: 9.5, fontWeight: 500, color: 'var(--text-secondary)',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {seller}
          </span>
        </div>

        {/* Distance */}
        {p.distance != null && p.distance >= 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
            <MapPin size={10} color="#F07B1D" style={{ flexShrink: 0 }} />
            <span style={{ fontSize: 9.5, fontWeight: 600, color: '#F07B1D' }}>
              {p.distance < 1
                ? `${Math.round(p.distance * 1000)} m away`
                : `${p.distance.toFixed(1)} km away`}
            </span>
          </div>
        )}

        {/* Price + VIEW button */}
        <div style={{
          display: 'flex', alignItems: 'center',
          justifyContent: 'space-between', marginTop: 'auto', paddingTop: 5,
        }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            <span style={{ fontWeight: 800, fontSize: 13, color: '#E65C00', letterSpacing: '-0.2px', lineHeight: 1 }}>
              ₹{displayPrice}
            </span>
            {hasDiscount && (
              <span style={{ fontSize: 9.5, textDecoration: 'line-through', color: 'var(--text-muted)', lineHeight: 1 }}>
                ₹{p.price}
              </span>
            )}
          </div>
          <Link
            href={`/market/${p.id}`}
            style={{
              display: 'flex', alignItems: 'center', gap: 3,
              height: 26, padding: '0 9px',
              background: 'var(--brand-gradient)',
              borderRadius: 999,
              boxShadow: '0 4px 12px rgba(240,123,29,0.25)',
              fontSize: 10, fontWeight: 700, color: 'white',
              textDecoration: 'none', flexShrink: 0,
            }}
          >
            <Plus size={11} /> VIEW
          </Link>
        </div>
      </div>
    </div>
  );
}

/* ─── Sub-category sidebar ──────────────────────────────────────────────── */

function SubCatSidebar({
  subCategories,
  selectedSubCat,
  onSelect,
}: {
  subCategories: SubCategory[];
  selectedSubCat: string;
  onSelect: (id: string) => void;
}) {
  return (
    <div
      className="scrollbar-hide"
      style={{
        width: 76, flexShrink: 0,
        background: 'var(--warm-tint)',
        border: '1px solid var(--border)',
        borderRadius: 16,
        position: 'sticky', top: 130,
        maxHeight: 'calc(100vh - 148px)',
        overflowY: 'auto',
        alignSelf: 'flex-start',
        paddingBottom: 8,
      }}
    >
      <SubCatItem label="All" imageUrl={null} active={!selectedSubCat} onClick={() => onSelect('')} />
      {subCategories.map((sub) => (
        <SubCatItem
          key={sub.id}
          label={sub.value}
          imageUrl={sub.imageUrl ?? null}
          active={selectedSubCat === sub.id}
          onClick={() => onSelect(selectedSubCat === sub.id ? '' : sub.id)}
        />
      ))}
    </div>
  );
}

function SubCatItem({
  label, imageUrl, active, onClick,
}: {
  label: string; imageUrl: string | null; active: boolean; onClick: () => void;
}) {
  const [imgErr, setImgErr] = useState(false);
  const src = imageUrl ? resolveImg(imageUrl) : null;
  const showImg = src && !imgErr;
  const Icon = getSubCatIcon(label);

  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        gap: 3, padding: '7px 4px 5px', width: '100%',
        border: 'none', borderLeft: active ? '3px solid #F07B1D' : '3px solid transparent',
        background: active ? 'rgba(240,123,29,0.07)' : 'none',
        cursor: 'pointer', boxSizing: 'border-box',
        transition: 'all 0.16s',
      }}
    >
      {/* 32×32 circle icon (Flutter spec) */}
      <div style={{
        width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
        background: active ? 'linear-gradient(135deg, #F9A84D 0%, #F07B1D 50%, #E65C00 100%)' : 'var(--surface)',
        border: active ? 'none' : '1.5px solid var(--border)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        overflow: 'hidden',
        boxShadow: active ? '0 4px 10px rgba(240,123,29,0.3)' : '0 1px 3px rgba(0,0,0,0.05)',
        transition: 'all 0.16s',
      }}>
        {showImg ? (
          <Image src={src!} alt={label} fill onError={() => setImgErr(true)}
            style={{ objectFit: 'cover' }} />
        ) : (
          <Icon size={14} color={active ? 'white' : 'var(--brown)'} strokeWidth={active ? 2.2 : 1.8} />
        )}
      </div>

      {/* Label — clamped to 2 lines */}
      <span style={{
        fontSize: 9, fontWeight: active ? 700 : 500, lineHeight: 1.25, textAlign: 'center',
        color: active ? 'var(--primary)' : 'var(--text-secondary)',
        width: '100%', padding: '0 3px',
        display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
        overflow: 'hidden',
        transition: 'color 0.16s',
      }}>
        {label}
      </span>
    </button>
  );
}

/* ─── Page ───────────────────────────────────────────────────────────────── */

export default function MarketPageClient() {
  const [banners, setBanners]             = useState<Banner[]>([]);
  const [categories, setCategories]       = useState<Category[]>([]);
  const [subCategories, setSubCategories] = useState<SubCategory[]>([]);
  const [products, setProducts]           = useState<Product[]>([]);
  const [loading, setLoading]             = useState(true);
  const [search, setSearch]               = useState('');
  const [draftSearch, setDraftSearch]     = useState('');
  const [selectedCat, setSelectedCat]     = useState('');
  const [selectedCatLabel, setSelectedCatLabel] = useState('');
  const [selectedSubCat, setSelectedSubCat]     = useState('');
  const [sort, setSort]                   = useState('');
  const [totalItems, setTotalItems]       = useState(0);
  const [page, setPage]                   = useState(1);
  const [totalPages, setTotalPages]       = useState(1);
  const [bannerIdx, setBannerIdx]         = useState(0);
  const [filterOpen, setFilterOpen]       = useState(false);
  const [userCoords, setUserCoords]       = useState<{ lat: number; lng: number } | null>(null);
  const [nearMeEnabled, setNearMeEnabled] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Geolocation is requested only when the user clicks "Near Me" — not on mount.

  /* bootstrap */
  useEffect(() => {
    marketApi.getMarketBanners()
      .then((res) => {
        const raw = res.data?.data ?? res.data ?? [];
        setBanners(Array.isArray(raw) ? raw : []);
      }).catch(() => {});

    marketApi.getCategories()
      .then((res) => {
        const raw = res.data?.data ?? res.data ?? {};
        const cats: Category[] =
          Array.isArray(raw.product_category) ? raw.product_category
          : Array.isArray(raw.categories)     ? raw.categories
          : Array.isArray(raw)                ? raw
          : [];
        setCategories(cats.filter(c => c.isActive !== false).slice(0, 32));

        const subs: SubCategory[] = Array.isArray(raw.product_subcategory)
          ? raw.product_subcategory.filter((s: SubCategory) => s.isActive !== false)
          : [];
        setSubCategories(subs);
      }).catch(() => {});
  }, []);

  /* banner autoplay */
  useEffect(() => {
    if (banners.length < 2) return;
    timerRef.current = setInterval(() => setBannerIdx((i) => (i + 1) % banners.length), 4000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [banners.length]);

  const stopAutoplay = () => { if (timerRef.current) clearInterval(timerRef.current); };
  const prevBanner   = () => { stopAutoplay(); setBannerIdx((i) => (i - 1 + banners.length) % banners.length); };
  const nextBanner   = () => { stopAutoplay(); setBannerIdx((i) => (i + 1) % banners.length); };

  /* products */
  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, unknown> = { page, limit: 12 };
      if (search)          params.search        = search;
      if (selectedCat)     params.categoryId    = selectedCat;
      if (selectedSubCat)  params.subcategoryId = selectedSubCat;
      if (sort === 'price_asc')  { params.sortBy = 'price'; params.sortOrder = 'asc'; }
      if (sort === 'price_desc') { params.sortBy = 'price'; params.sortOrder = 'desc'; }
      if (nearMeEnabled && userCoords) { params.lat = userCoords.lat; params.lng = userCoords.lng; }

      const res = await marketApi.getProducts(params);
      const payload = res.data?.data ?? res.data ?? {};
      const list: Product[] = Array.isArray(payload) ? payload : (payload.data ?? []);
      setProducts(list);
      setTotalPages(payload.totalPages ?? payload.pages ?? 1);
      setTotalItems(payload.totalItems ?? payload.total ?? payload.count ?? list.length);
    } catch {
      setProducts([]);
      toast.error('Failed to load products. Try again.');
    } finally {
      setLoading(false);
    }
  }, [page, search, selectedCat, selectedSubCat, sort, userCoords, nearMeEnabled]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  const handleSearch  = (e: React.FormEvent) => { e.preventDefault(); setSearch(draftSearch); setPage(1); };
  const clearSearch   = () => { setDraftSearch(''); setSearch(''); setPage(1); };
  const handleSort    = (val: string) => { setSort(val); setPage(1); };
  const selectCat     = (key: string, label: string) => {
    if (selectedCat === key) { setSelectedCat(''); setSelectedCatLabel(''); }
    else { setSelectedCat(key); setSelectedCatLabel(label); }
    setSelectedSubCat('');
    setPage(1);
  };
  const selectSubCat  = (id: string) => { setSelectedSubCat(id); setPage(1); };

  const pageRange = (): (number | '…')[] => {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
    if (page <= 4)              return [1, 2, 3, 4, 5, '…', totalPages];
    if (page >= totalPages - 3) return [1, '…', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
    return [1, '…', page - 1, page, page + 1, '…', totalPages];
  };

  const hasFilters = !!(selectedCat || selectedSubCat || sort || nearMeEnabled);

  return (
    <div style={{ background: 'var(--canvas)', minHeight: '100vh', paddingBottom: 80 }}>

      {/* ── Banner carousel ── */}
      {banners.length > 0 && (
        <div style={{ padding: '8px 12px 0' }}>
          <div style={{ position: 'relative', height: 140, borderRadius: 16, overflow: 'hidden', background: 'var(--primary-light)' }}>
            <div style={{ display: 'flex', height: '100%', width: `${banners.length * 100}%`, transform: `translateX(-${bannerIdx * (100 / banners.length)}%)`, transition: 'transform 0.5s ease' }}>
              {banners.map((b, i) => (
                <div key={b.id ?? i} style={{ height: '100%', flexShrink: 0, position: 'relative', width: `${100 / banners.length}%` }}>
                  {bannerSrc(b)
                    ? <Image src={bannerSrc(b)} alt={b.title ?? ''} fill style={{ objectFit: 'cover' }} />
                    : b.title && <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}><p style={{ fontWeight: 600, color: 'var(--brown)' }}>{b.title}</p></div>
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
                <div style={{ position: 'absolute', bottom: 8, left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: 4 }}>
                  {banners.map((_, i) => (
                    <button key={i} onClick={() => { stopAutoplay(); setBannerIdx(i); }} style={{ height: 4, borderRadius: 999, border: 'none', cursor: 'pointer', transition: 'all 0.3s', width: i === bannerIdx ? 10 : 4, background: i === bannerIdx ? '#F07B1D' : '#EFE7DC', padding: 0 }} />
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* ── Category tabs (sticky) ── */}
      {categories.length > 0 && (
        <div style={{ padding: '8px 12px 12px', background: 'var(--canvas)', borderBottom: '1px solid var(--border)', position: 'sticky', top: 60, zIndex: 20 }}>
          <div className="scrollbar-hide" style={{ display: 'flex', gap: 4, overflowX: 'auto', background: 'var(--warm-tint)', border: '1px solid var(--border)', borderRadius: 12, padding: 4 }}>
            <button onClick={() => { setSelectedCat(''); setSelectedCatLabel(''); setSelectedSubCat(''); setPage(1); }} style={{ flexShrink: 0, padding: '7px 16px', borderRadius: 10, border: 'none', fontSize: 12.5, cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all 0.16s', fontWeight: !selectedCat ? 700 : 500, background: !selectedCat ? 'var(--brand-gradient)' : 'transparent', color: !selectedCat ? 'white' : 'var(--text-secondary)', boxShadow: !selectedCat ? 'var(--shadow-brand)' : 'none' }}>
              All
            </button>
            {categories.map((cat, i) => {
              const key = catKey(cat); const label = catLabel(cat); const active = selectedCat === key;
              return (
                <button key={cat.id ?? i} onClick={() => selectCat(key, label)} style={{ flexShrink: 0, padding: '7px 16px', borderRadius: 10, border: 'none', fontSize: 12.5, cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all 0.16s', fontWeight: active ? 700 : 500, background: active ? 'var(--brand-gradient)' : 'transparent', color: active ? 'white' : 'var(--text-secondary)', boxShadow: active ? 'var(--shadow-brand)' : 'none' }}>
                  {label}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Body: sidebar + content ── */}
      <div style={{ display: 'flex', gap: 0, padding: '12px 0 0' }}>

        {/* Sub-category sidebar — only when a parent category is active */}
        {(() => {
          const filtered = selectedCat
            ? subCategories.filter((s) => s.parentId === selectedCat)
            : [];
          return filtered.length > 0 ? (
            <div style={{ padding: '0 0 0 8px', flexShrink: 0 }}>
              <SubCatSidebar
                subCategories={filtered}
                selectedSubCat={selectedSubCat}
                onSelect={selectSubCat}
              />
            </div>
          ) : null;
        })()}

        {/* Main content */}
        <div style={{ flex: 1, minWidth: 0, padding: '0 8px' }}>

          {/* Search + Filter */}
          <form onSubmit={handleSearch} style={{ display: 'flex', gap: 8, marginBottom: filterOpen ? 8 : 12 }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
              <input className="input" placeholder="Search…" value={draftSearch} onChange={(e) => setDraftSearch(e.target.value)} style={{ paddingLeft: 36, paddingRight: draftSearch ? 34 : 12, fontSize: 13 }} />
              {draftSearch && (
                <button type="button" onClick={clearSearch} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                  <X size={14} />
                </button>
              )}
            </div>
            <button type="button" onClick={() => setFilterOpen((o) => !o)} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '0 10px', borderRadius: 12, fontWeight: 700, fontSize: 12, border: hasFilters ? 'none' : '1.5px solid var(--border)', background: hasFilters ? 'var(--brand-gradient)' : 'var(--surface)', color: hasFilters ? 'white' : 'var(--text-muted)', cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0 }}>
              <SlidersHorizontal size={14} />
              {hasFilters ? 'On' : 'Sort'}
            </button>
          </form>

          {/* Filter panel */}
          {filterOpen && (
            <div style={{ display: 'flex', gap: 10, marginBottom: 12, flexWrap: 'wrap', padding: '10px 12px', background: 'var(--surface)', borderRadius: 12, border: '1.5px solid var(--border)' }}>
              <div style={{ position: 'relative', flex: '1 1 120px' }}>
                <select className="input" value={sort} onChange={(e) => handleSort(e.target.value)} style={{ paddingRight: 28, appearance: 'none', cursor: 'pointer', fontSize: 12 }}>
                  <option value="">Sort: Default</option>
                  <option value="price_asc">Price: Low → High</option>
                  <option value="price_desc">Price: High → Low</option>
                </select>
                <ChevronRight size={12} style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%) rotate(90deg)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
              </div>
              {/* Near Me toggle */}
              <button
                onClick={() => {
                  if (!userCoords && navigator.geolocation) {
                    navigator.geolocation.getCurrentPosition(
                      (pos) => {
                        setUserCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
                        setNearMeEnabled(true);
                      },
                      () => {},
                      { timeout: 8000 },
                    );
                  } else {
                    setNearMeEnabled((n) => !n);
                  }
                }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px',
                  borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer',
                  background: nearMeEnabled ? 'rgba(240,123,29,0.12)' : 'none',
                  color: nearMeEnabled ? '#F07B1D' : 'var(--text-muted)',
                  border: `1.5px solid ${nearMeEnabled ? 'rgba(240,123,29,0.4)' : 'var(--border)'}`,
                  whiteSpace: 'nowrap',
                }}
              >
                <Navigation size={13} color={nearMeEnabled ? '#F07B1D' : 'currentColor'} />
                Near Me
              </button>
              {hasFilters && (
                <button onClick={() => { setSort(''); setSelectedCat(''); setSelectedCatLabel(''); setSelectedSubCat(''); setNearMeEnabled(false); }} style={{ fontSize: 11, fontWeight: 600, color: 'var(--primary)', background: 'none', border: 'none', cursor: 'pointer', padding: '4px 6px' }}>
                  Clear all
                </button>
              )}
            </div>
          )}

          {/* Item count + active filters */}
          {(!loading && (totalItems > 0 || selectedCat || search || nearMeEnabled)) && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10, flexWrap: 'wrap' }}>
              {nearMeEnabled && userCoords && (
                <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10.5, fontWeight: 700, color: '#F07B1D', background: 'rgba(240,123,29,0.10)', border: '1px solid rgba(240,123,29,0.30)', borderRadius: 999, padding: '3px 9px' }}>
                  <Navigation size={11} color="#F07B1D" />
                  Near Me
                </span>
              )}
              {totalItems > 0 && (
                <span style={{ fontSize: 10.5, fontWeight: 600, color: 'var(--brown)', background: 'var(--warm-tint)', border: '1px solid var(--border)', borderRadius: 999, padding: '3px 9px' }}>
                  {totalItems} items
                </span>
              )}
              {selectedCat && (
                <span style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 10.5, fontWeight: 600, color: 'var(--primary)', background: 'rgba(240,123,29,0.08)', border: '1px solid rgba(240,123,29,0.2)', borderRadius: 999, padding: '3px 8px' }}>
                  {selectedCatLabel}
                  <button onClick={() => { setSelectedCat(''); setSelectedCatLabel(''); setPage(1); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--primary)', padding: 0, display: 'flex', lineHeight: 1 }}>
                    <X size={10} />
                  </button>
                </span>
              )}
              {selectedSubCat && (
                <span style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 10.5, fontWeight: 600, color: 'var(--brown)', background: 'rgba(123,74,30,0.08)', border: '1px solid rgba(123,74,30,0.2)', borderRadius: 999, padding: '3px 8px' }}>
                  {subCategories.find(s => s.id === selectedSubCat)?.value ?? ''}
                  <button onClick={() => { setSelectedSubCat(''); setPage(1); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--brown)', padding: 0, display: 'flex', lineHeight: 1 }}>
                    <X size={10} />
                  </button>
                </span>
              )}
            </div>
          )}

          {/* Product grid */}
          {loading ? (
            <div className="market-grid">
              {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
            </div>
          ) : products.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', paddingTop: 48, paddingBottom: 48, textAlign: 'center' }}>
              <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'var(--warm-tint)', border: '2px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
                <Package size={30} color="var(--primary)" strokeWidth={1.5} />
              </div>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)', marginBottom: 6 }}>No products found</h3>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.55 }}>
                {search || selectedCat || selectedSubCat ? 'Try a different filter.' : 'Check back soon!'}
              </p>
              {(search || hasFilters) && (
                <button className="btn-outline" style={{ marginTop: 14, fontSize: 12, padding: '7px 18px' }} onClick={() => { clearSearch(); setSelectedCat(''); setSelectedCatLabel(''); setSelectedSubCat(''); }}>
                  Clear filters
                </button>
              )}
            </div>
          ) : (
            <div className="market-grid">
              {products.map((p) => <ProductCard key={p.id} p={p} />)}
            </div>
          )}

          {/* Pagination */}
          {!loading && totalPages > 1 && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, marginTop: 24 }}>
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="btn-outline" style={{ padding: '6px 10px' }}>
                <ChevronLeft size={15} />
              </button>
              {pageRange().map((n, i) =>
                n === '…' ? (
                  <span key={`el-${i}`} style={{ fontSize: 12, color: 'var(--text-muted)', padding: '0 3px' }}>…</span>
                ) : (
                  <button key={n} onClick={() => setPage(n as number)} style={{ width: 32, height: 32, borderRadius: 8, fontSize: 12, fontWeight: 600, border: 'none', cursor: 'pointer', transition: 'all 0.15s', background: page === n ? 'var(--brand-gradient)' : 'var(--surface)', color: page === n ? 'white' : 'var(--text-muted)', boxShadow: page === n ? 'var(--shadow-brand)' : '0 1px 3px rgba(0,0,0,0.06)' }}>
                    {n}
                  </button>
                )
              )}
              <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="btn-outline" style={{ padding: '6px 10px' }}>
                <ChevronRight size={15} />
              </button>
            </div>
          )}
        </div>
      </div>

      <style>{`
        .market-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 8px;
          margin-bottom: 16px;
        }
        @media (min-width: 500px) { .market-grid { grid-template-columns: repeat(3, 1fr); } }
        @media (min-width: 768px) { .market-grid { grid-template-columns: repeat(4, 1fr); gap: 10px; } }
      `}</style>
    </div>
  );
}
