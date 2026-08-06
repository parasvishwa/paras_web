'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import {
  Search, MapPin, Star, ChevronLeft, ChevronRight,
  Home, Store, UserCheck, Users, SlidersHorizontal, ShieldCheck, Navigation, X,
} from 'lucide-react';
import { exploreApi } from '@/lib/api';
import { useI18n } from '@/lib/i18n/I18nContext';

interface UserCard {
  id: string;
  fullname: string;
  businessName?: string;
  profilePhoto?: string;
  state?: string;
  district?: string;
  badge?: string;
  avgRating?: number;
  reviewCount?: number;
  isVerified?: boolean;
  followers_count?: number;
  distance?: number;
  totalProductCount?: number;
  totalGauVansh?: number;
  role?: string;
}

const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
  'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
  'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
  'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
  'Delhi', 'Jammu and Kashmir', 'Ladakh',
];
const BADGE_OPTIONS = ['Platinum', 'Gold', 'Silver', 'No Badge'];

type RoleTab = 'Gaushala' | 'Vendor' | 'Expert' | 'NGO' | 'Influencer';

const ROLE_CONFIG: Record<RoleTab, {
  label: string;
  icon: React.ReactNode;
  placeholder: string;
  emptyText: string;
  profilePath: (u: UserCard) => string;
  apiRole: string;
  showBadge: boolean;
}> = {
  Gaushala: {
    label: 'Gaushalas', icon: <Home size={14} />,
    placeholder: 'Search gaushalas by name...',
    emptyText: 'No gaushalas found',
    profilePath: (u) => gaushalaSlugPath(u),
    apiRole: 'Gaushala', showBadge: true,
  },
  Vendor: {
    label: 'Vendors', icon: <Store size={14} />,
    placeholder: 'Search vendors by name...',
    emptyText: 'No vendors found',
    profilePath: (u) => gaushalaSlugPath(u),
    apiRole: 'Vendor', showBadge: false,
  },
  Expert: {
    label: 'Experts', icon: <UserCheck size={14} />,
    placeholder: 'Search experts by name...',
    emptyText: 'No experts found',
    profilePath: (u) => `/expert/${u.id}`,
    apiRole: 'Expert', showBadge: false,
  },
  NGO: {
    label: 'NGO', icon: <UserCheck size={14} />,
    placeholder: 'Search NGOs by name...',
    emptyText: 'No NGOs found',
    profilePath: (u) => gaushalaSlugPath(u),
    apiRole: 'NGO', showBadge: false,
  },
  Influencer: {
    label: 'Influencers', icon: <Users size={14} />,
    placeholder: 'Search influencers by name...',
    emptyText: 'No influencers found',
    profilePath: (u) => gaushalaSlugPath(u),
    apiRole: 'Influencer', showBadge: false,
  },
};

function toSlug(str: string) {
  return str.toLowerCase().replace(/[^\w\s-]/g, '').trim().replace(/[\s_]+/g, '-').replace(/-+/g, '-');
}
function gaushalaSlugPath(u: UserCard) {
  const name = u.businessName || u.fullname || '';
  const city = u.district || u.state || '';
  const parts = [name, city].filter(Boolean).map(toSlug).filter(Boolean).join('-');
  return `/gaushala/${parts ? `${parts}-${u.id}` : u.id}`;
}

const BACKEND = 'https://app.gaubook.org';
function resolveImg(url?: string | null): string | undefined {
  if (!url) return undefined;
  if (url.startsWith('http')) return url;
  if (url.startsWith('/')) return `${BACKEND}${url}`;
  return url;
}

function formatDist(raw: number | string) {
  const km = typeof raw === 'string' ? parseFloat(raw) : raw;
  if (isNaN(km)) return '';
  if (km < 1) return `${Math.round(km * 1000)} m`;
  if (km < 10) return `${km.toFixed(1)} km`;
  return `${Math.round(km)} km`;
}

function StarRating({ rating }: { rating: number }) {
  const full = Math.floor(rating);
  const half = rating - full >= 0.5;
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 1.5 }}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star key={i} size={11}
          fill={i <= full ? '#F59E0B' : i === full + 1 && half ? '#F59E0B' : 'none'}
          color={i <= full || (i === full + 1 && half) ? '#F59E0B' : '#D1D5DB'} />
      ))}
    </span>
  );
}

function GaushalaRow({ u, profilePath, activeRole }: { u: UserCard; profilePath: string; activeRole?: string }) {
  const [imgError, setImgError] = useState(false);
  const name = u.businessName || u.fullname || '';
  const location = [u.district, u.state].filter(Boolean).join(', ');
  const imgSrc = resolveImg(u.profilePhoto);
  const gauVansh = u.totalGauVansh ?? 0;
  const products = u.totalProductCount ?? 0;
  const isGaushala = activeRole === 'Gaushala' || (!activeRole && gauVansh >= 0);

  return (
    <Link
      href={profilePath}
      className="card-hover"
      style={{
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '12px 16px',
        background: 'white', borderRadius: 16,
        border: '1px solid #EFE7DC', textDecoration: 'none',
        boxShadow: '0 8px 18px -6px rgba(123,74,30,0.06), 0 1px 4px rgba(123,74,30,0.04)',
      }}
    >
      {/* Square image — Flutter: 88×88, 12px radius, #EFE7DC border */}
      <div style={{ position: 'relative', flexShrink: 0 }}>
        <div style={{
          width: 88, height: 88, borderRadius: 12,
          border: '1px solid #EFE7DC',
          overflow: 'hidden', background: '#FBF3E9',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#7B4A1E', fontWeight: 800, fontSize: 22,
        }}>
          {imgSrc && !imgError
            ? <img src={imgSrc} alt={name} onError={() => setImgError(true)}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            : <span style={{ textTransform: 'uppercase' }}>{name.slice(0, 2)}</span>}
        </div>
        {/* Verified badge — bottom-right of image, gold (Flutter: Icons.verified_rounded, #C9A227) */}
        {u.isVerified && (
          <div style={{
            position: 'absolute', bottom: -3, right: -3,
            width: 20, height: 20, borderRadius: '50%',
            background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 1px 4px rgba(0,0,0,0.15)',
          }}>
            <ShieldCheck size={13} fill="#C9A227" color="#C9A227" />
          </div>
        )}
      </div>

      {/* Content — Flutter column layout */}
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 3 }}>
        {/* Name — Flutter: 12px, w700, #7B4A1E (brown) */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 6 }}>
          <h3 style={{
            fontWeight: 700, fontSize: 12, lineHeight: 1.25, color: '#7B4A1E',
            textTransform: 'capitalize',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1,
          }}>
            {name.toLowerCase()}
          </h3>
          {/* Proximity pill */}
          {u.distance != null && (
            <span style={{
              fontSize: 10.5, fontWeight: 700, color: '#F07B1D',
              background: 'rgba(240,123,29,0.10)', borderRadius: 999,
              padding: '2px 7px', whiteSpace: 'nowrap', flexShrink: 0,
            }}>
              📍 {formatDist(u.distance)}
            </span>
          )}
        </div>

        {/* Location — Flutter: 11px, #677294, place icon */}
        {location && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
            <MapPin size={11} color="#677294" style={{ flexShrink: 0 }} />
            <span style={{ fontSize: 11, color: '#677294', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {location}
            </span>
          </div>
        )}

        {/* Stats row: rating · gau vansh · products · followers */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, flexWrap: 'wrap', marginTop: 1 }}>
          {!!u.avgRating && u.avgRating > 0 && (
            <>
              <Star size={13} fill="#C9A227" color="#C9A227" />
              <span style={{ fontSize: 11, fontWeight: 700, color: '#000' }}>
                {u.avgRating.toFixed(1)}
              </span>
              {u.reviewCount ? <span style={{ fontSize: 11, color: '#677294' }}>({u.reviewCount})</span> : null}
            </>
          )}
          {(activeRole === 'Gaushala' || gauVansh > 0) && (
            <>
              {(!!u.avgRating && u.avgRating > 0) && <span style={{ color: '#D1D5DB', fontSize: 11 }}>·</span>}
              <Home size={11} color="#7B4A1E" style={{ flexShrink: 0 }} />
              <span style={{ fontSize: 11, fontWeight: 600, color: '#7B4A1E' }}>
                {gauVansh > 0 ? gauVansh.toLocaleString() : '—'} Gau Vansh
              </span>
            </>
          )}
          {(activeRole === 'Vendor' ? true : products > 0) && (
            <>
              <span style={{ color: '#D1D5DB', fontSize: 11 }}>·</span>
              <Store size={11} color="#F07B1D" style={{ flexShrink: 0 }} />
              <span style={{ fontSize: 11, fontWeight: 600, color: '#F07B1D' }}>
                {products > 0 ? products : '—'} Products
              </span>
            </>
          )}
          {!!u.followers_count && u.followers_count > 0 && (
            <>
              <span style={{ color: '#D1D5DB', fontSize: 11 }}>·</span>
              <Users size={11} color="#677294" />
              <span style={{ fontSize: 11, color: '#677294' }}>
                {u.followers_count.toLocaleString()}
              </span>
            </>
          )}
        </div>
      </div>
    </Link>
  );
}

function SkeletonRow() {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px',
      background: 'white', borderRadius: 16, border: '1px solid #EFE7DC',
      boxShadow: '0 8px 18px -6px rgba(123,74,30,0.06), 0 1px 4px rgba(123,74,30,0.04)',
    }}>
      <div className="skeleton" style={{ width: 88, height: 88, borderRadius: 12, flexShrink: 0 }} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8, paddingTop: 2 }}>
        <div className="skeleton" style={{ height: 12, width: '60%', borderRadius: 6 }} />
        <div className="skeleton" style={{ height: 11, width: '40%', borderRadius: 6 }} />
        <div className="skeleton" style={{ height: 11, width: '50%', borderRadius: 6 }} />
        <div className="skeleton" style={{ height: 11, width: '35%', borderRadius: 6 }} />
      </div>
    </div>
  );
}

export default function ExplorePage() {
  const { t } = useI18n();
  const [activeRole, setActiveRole] = useState<RoleTab>('Gaushala');
  const [users, setUsers] = useState<UserCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [stateFilter, setStateFilter] = useState('');
  const [badgeFilter, setBadgeFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [nearMeActive, setNearMeActive] = useState(false);
  const [nearMeRadius, setNearMeRadius] = useState<number | null>(50);
  const [locationError, setLocationError] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);

  const config = ROLE_CONFIG[activeRole];
  const hasFilters = !!(stateFilter || badgeFilter || nearMeActive);

  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setNearMeActive(true);
      },
      () => {},
      { timeout: 8000 },
    );
  }, []);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(t);
  }, [search]);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      let list: UserCard[] = [];
      let tp = 1;

      if (nearMeActive && userCoords && activeRole === 'Gaushala' && nearMeRadius !== null) {
        // Use dedicated nearby endpoint — filters by radius, sorted by distance
        const res = await exploreApi.getNearby(userCoords.lat, userCoords.lng, nearMeRadius);
        const raw = res.data;
        const inner = raw?.data ?? raw;
        if (Array.isArray(inner?.gaushalas)) list = inner.gaushalas;
        else if (Array.isArray(inner?.users)) list = inner.users;
        else if (Array.isArray(inner)) list = inner;
        tp = inner?.totalPages || raw?.totalPages || 1;
      } else {
        const params: Record<string, unknown> = { page, limit: 20, role: config.apiRole };
        if (debouncedSearch) params.search = debouncedSearch;
        if (stateFilter) params.state = stateFilter;
        if (badgeFilter === 'No Badge') params.badge = '';
        else if (badgeFilter) params.badge = badgeFilter;
        if (userCoords) { params.lat = userCoords.lat; params.lng = userCoords.lng; }

        const res = await exploreApi.getGaushalas(params);
        const raw = res.data;
        const inner = raw?.data ?? raw;
        if (Array.isArray(inner?.gaushalas)) list = inner.gaushalas;
        else if (Array.isArray(inner?.users)) list = inner.users;
        else if (Array.isArray(inner)) list = inner;
        tp = inner?.totalPages || raw?.totalPages
          || (inner?.total ? Math.ceil(inner.total / 20) : 0) || 1;
      }

      setUsers(list);
      setTotalPages(tp);
    } catch {
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch, stateFilter, badgeFilter, config.apiRole, userCoords, nearMeActive, nearMeRadius, activeRole]);

  useEffect(() => { setPage(1); setUsers([]); }, [activeRole, debouncedSearch, stateFilter, badgeFilter]);
  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const handleRoleChange = (role: RoleTab) => {
    setActiveRole(role);
    setSearch('');
    setDebouncedSearch('');
    setStateFilter('');
    setBadgeFilter('');
    setPage(1);
    setFilterOpen(false);
  };

  const chipScrollRef = useRef<HTMLDivElement>(null);
  const chipDrag = useRef({ active: false, startX: 0, scrollLeft: 0 });

  const onChipMouseDown = (e: React.MouseEvent) => {
    const el = chipScrollRef.current; if (!el) return;
    chipDrag.current = { active: true, startX: e.pageX - el.offsetLeft, scrollLeft: el.scrollLeft };
    el.style.cursor = 'grabbing';
  };
  const onChipMouseMove = (e: React.MouseEvent) => {
    const d = chipDrag.current; const el = chipScrollRef.current;
    if (!d.active || !el) return;
    e.preventDefault();
    el.scrollLeft = d.scrollLeft - (e.pageX - el.offsetLeft - d.startX);
  };
  const onChipMouseUp = () => {
    chipDrag.current.active = false;
    if (chipScrollRef.current) chipScrollRef.current.style.cursor = 'grab';
  };

  return (
    <div style={{ background: 'var(--canvas)', minHeight: '100vh', paddingBottom: 80 }}>

      {/* ── Role chips — draggable horizontal scroll ── */}
      <div style={{ display: 'flex', justifyContent: 'center', padding: '14px 0 2px' }}>
        <div
          ref={chipScrollRef}
          className="scrollbar-hide"
          onMouseDown={onChipMouseDown}
          onMouseMove={onChipMouseMove}
          onMouseUp={onChipMouseUp}
          onMouseLeave={onChipMouseUp}
          style={{
            overflowX: 'auto', display: 'flex', gap: 8,
            padding: '0 16px',
            cursor: 'grab', userSelect: 'none',
            maxWidth: '100%',
          }}
        >
        <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
          {(Object.keys(ROLE_CONFIG) as RoleTab[]).map((role) => {
            const cfg = ROLE_CONFIG[role];
            const active = activeRole === role;
            return (
              <button key={role} onClick={() => handleRoleChange(role)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '9px 18px', borderRadius: 100,
                  fontSize: 13, fontWeight: 700, cursor: 'pointer',
                  border: active ? 'none' : '1.5px solid var(--border)',
                  whiteSpace: 'nowrap', transition: 'all 0.15s',
                  background: active ? 'var(--primary)' : 'var(--surface)',
                  color: active ? 'white' : 'var(--text-muted)',
                  boxShadow: active ? '0 4px 12px rgba(240,123,29,0.28)' : 'none',
                }}
              >
                {cfg.icon} {cfg.label}
              </button>
            );
          })}
        </div>
        </div>
      </div>

      <div style={{ maxWidth: 680, margin: '0 auto', padding: '12px 16px 0' }}>

        {/* ── Search + Filter button ── */}
        <div style={{ display: 'flex', gap: 10, marginBottom: filterOpen ? 10 : 16 }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={16} style={{
              position: 'absolute', left: 13, top: '50%',
              transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none',
            }} />
            <input
              className="input"
              type="text"
              placeholder={config.placeholder}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ paddingLeft: 40, borderRadius: 12, fontSize: 14 }}
            />
          </div>
          <button
            onClick={() => setFilterOpen((o) => !o)}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '0 16px', borderRadius: 12, fontWeight: 700, fontSize: 13,
              border: hasFilters ? 'none' : '1.5px solid var(--border)',
              background: hasFilters ? 'var(--primary)' : 'var(--surface)',
              color: hasFilters ? 'white' : 'var(--text-muted)',
              cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0,
            }}
          >
            <SlidersHorizontal size={15} />
            {t('filter')}
          </button>
        </div>

        {/* ── Filter panel ── */}
        {filterOpen && (
          <div style={{
            display: 'flex', gap: 10, marginBottom: 14, flexWrap: 'wrap',
            justifyContent: 'center',
            padding: '12px 14px', background: 'var(--surface)',
            borderRadius: 14, border: '1.5px solid var(--border)',
          }}>
            <div style={{ position: 'relative', flex: '1 1 140px' }}>
              <select
                className="input"
                value={stateFilter}
                onChange={(e) => setStateFilter(e.target.value)}
                style={{ paddingRight: 32, appearance: 'none', cursor: 'pointer', fontSize: 13 }}
              >
                <option value="">All States</option>
                {INDIAN_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
              <ChevronRight size={13} style={{
                position: 'absolute', right: 10, top: '50%',
                transform: 'translateY(-50%) rotate(90deg)',
                color: 'var(--text-muted)', pointerEvents: 'none',
              }} />
            </div>
            {config.showBadge && (
              <div style={{ position: 'relative', flex: '1 1 120px' }}>
                <select
                  className="input"
                  value={badgeFilter}
                  onChange={(e) => setBadgeFilter(e.target.value)}
                  style={{ paddingRight: 32, appearance: 'none', cursor: 'pointer', fontSize: 13 }}
                >
                  <option value="">All Badges</option>
                  {BADGE_OPTIONS.map((b) => <option key={b} value={b}>{b}</option>)}
                </select>
                <ChevronRight size={13} style={{
                  position: 'absolute', right: 10, top: '50%',
                  transform: 'translateY(-50%) rotate(90deg)',
                  color: 'var(--text-muted)', pointerEvents: 'none',
                }} />
              </div>
            )}
            {/* Near Me toggle + radius selector */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
              <button
                onClick={() => {
                  if (!userCoords && navigator.geolocation) {
                    navigator.geolocation.getCurrentPosition(
                      (pos) => {
                        setUserCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
                        setNearMeActive(true);
                        setLocationError(false);
                      },
                      () => setLocationError(true),
                      { timeout: 8000 },
                    );
                  } else {
                    setNearMeActive((n) => !n);
                    setLocationError(false);
                  }
                }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 5, padding: '7px 12px',
                  borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer',
                  background: nearMeActive ? 'rgba(240,123,29,0.12)' : 'none',
                  color: nearMeActive ? '#F07B1D' : 'var(--text-muted)',
                  border: `1.5px solid ${nearMeActive ? 'rgba(240,123,29,0.4)' : 'var(--border)'}`,
                  whiteSpace: 'nowrap',
                }}
              >
                <Navigation size={13} color={nearMeActive ? '#F07B1D' : 'currentColor'} />
                {t('nearMe')}
              </button>
              {nearMeActive && (
                <div style={{ position: 'relative' }}>
                  <select
                    value={nearMeRadius ?? 'any'}
                    onChange={(e) => {
                      const v = e.target.value;
                      setNearMeRadius(v === 'any' ? null : Number(v));
                    }}
                    style={{
                      appearance: 'none', cursor: 'pointer',
                      padding: '7px 28px 7px 10px', borderRadius: 8,
                      fontSize: 12, fontWeight: 700,
                      background: 'rgba(240,123,29,0.10)',
                      color: '#F07B1D',
                      border: '1.5px solid rgba(240,123,29,0.40)',
                    }}
                  >
                    <option value={5}>5 km</option>
                    <option value={10}>10 km</option>
                    <option value={25}>25 km</option>
                    <option value={50}>50 km</option>
                    <option value="any">Anywhere</option>
                  </select>
                  <ChevronRight size={12} style={{
                    position: 'absolute', right: 8, top: '50%',
                    transform: 'translateY(-50%) rotate(90deg)',
                    color: '#F07B1D', pointerEvents: 'none',
                  }} />
                </div>
              )}
            </div>
            {hasFilters && (
              <button
                onClick={() => { setStateFilter(''); setBadgeFilter(''); setNearMeActive(false); setNearMeRadius(50); setLocationError(false); }}
                style={{
                  fontSize: 12, fontWeight: 600, color: 'var(--primary)',
                  background: 'none', border: 'none', cursor: 'pointer', padding: '4px 6px',
                }}
              >
                {t('clear')}
              </button>
            )}
          </div>
        )}

        {locationError && (
          <p style={{ fontSize: 12, color: '#e53e3e', marginBottom: 10, paddingLeft: 4 }}>
            Location access denied. Please allow location in browser settings.
          </p>
        )}

        {/* ── List ── */}
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => <SkeletonRow key={i} />)}
          </div>
        ) : users.length === 0 ? (
          <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            justifyContent: 'center', paddingTop: 72, paddingBottom: 72, textAlign: 'center',
          }}>
            <div style={{
              width: 88, height: 88, borderRadius: '50%', background: 'var(--primary-light)',
              border: '2px solid var(--border)', display: 'flex', alignItems: 'center',
              justifyContent: 'center', marginBottom: 18,
            }}>
              {activeRole === 'Vendor' ? <Store size={38} color="var(--primary)" strokeWidth={1.5} />
                : activeRole === 'Expert' || activeRole === 'NGO' ? <UserCheck size={38} color="var(--primary)" strokeWidth={1.5} />
                : activeRole === 'Influencer' ? <Users size={38} color="var(--primary)" strokeWidth={1.5} />
                : <Home size={38} color="var(--primary)" strokeWidth={1.5} />}
            </div>
            <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text)', marginBottom: 6, letterSpacing: '-0.3px' }}>
              {config.emptyText}
            </h3>
            <p style={{ fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.55, maxWidth: 240 }}>
              Try adjusting your search or filter criteria
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {users.map((u) => (
              <GaushalaRow key={u.id} u={u} profilePath={config.profilePath(u)} activeRole={activeRole} />
            ))}
          </div>
        )}

        {/* ── Pagination ── */}
        {!loading && totalPages > 1 && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, marginTop: 28 }}>
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="btn-outline"
              style={{ fontSize: 13, padding: '8px 16px', display: 'flex', alignItems: 'center', gap: 4 }}
            >
              <ChevronLeft size={15} /> {t('previous')}
            </button>
            <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Page {page} of {totalPages}</span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="btn-outline"
              style={{ fontSize: 13, padding: '8px 16px', display: 'flex', alignItems: 'center', gap: 4 }}
            >
              {t('next')} <ChevronRight size={15} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
