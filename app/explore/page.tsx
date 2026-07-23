'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Search, MapPin, Star, ChevronLeft, ChevronRight, Home, Store, UserCheck } from 'lucide-react';
import { exploreApi } from '@/lib/api';

interface UserCard {
  id: string;
  fullname: string;
  businessName?: string;
  profilePhoto?: string;
  coverPhoto?: string | string[];
  state?: string;
  district?: string;
  badge?: string;
  credibilityScore?: number;
  avgRating?: number;
  reviewCount?: number;
  isVerified?: boolean;
  followers_count?: number;
  distance?: number;
  totalProductCount?: number;
  totalGauVansh?: number;
  role?: string;
}

const BADGE_STYLES: Record<string, { bg: string; color: string }> = {
  Platinum: { bg: '#E8F4FD', color: '#1E6EAB' },
  Gold: { bg: '#FEF3C7', color: '#B45309' },
  Silver: { bg: '#F3F4F6', color: '#4B5563' },
};

const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
  'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
  'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
  'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
  'Delhi', 'Jammu and Kashmir', 'Ladakh',
];

const BADGE_OPTIONS = ['Platinum', 'Gold', 'Silver', 'No Badge'];

type RoleTab = 'Gaushala' | 'Vendor' | 'Expert' | 'NGO';

const ROLE_CONFIG: Record<RoleTab, {
  label: string;
  icon: React.ReactNode;
  heading: string;
  description: string;
  searchPlaceholder: string;
  emptyText: string;
  profilePath: (id: string) => string;
  apiRole: string;
}> = {
  Gaushala: {
    label: 'Gaushalas',
    icon: <Home size={14} />,
    heading: 'Explore Gaushalas',
    description: 'Discover verified gaushalas across India',
    searchPlaceholder: 'Search gaushalas by name...',
    emptyText: 'No gaushalas found',
    profilePath: (id) => `/gaushala/${id}`,
    apiRole: 'Gaushala',
  },
  Vendor: {
    label: 'Vendors',
    icon: <Store size={14} />,
    heading: 'Explore Vendors',
    description: 'Find gau product vendors and stores across India',
    searchPlaceholder: 'Search vendors by name...',
    emptyText: 'No vendors found',
    profilePath: (id) => `/gaushala/${id}`,
    apiRole: 'Vendor',
  },
  Expert: {
    label: 'Experts',
    icon: <UserCheck size={14} />,
    heading: 'Explore Experts',
    description: 'Connect with veterinarians and gau seva experts',
    searchPlaceholder: 'Search experts by name...',
    emptyText: 'No experts found',
    profilePath: (id) => `/expert/${id}`,
    apiRole: 'Expert',
  },
  NGO: {
    label: 'NGO',
    icon: <UserCheck size={14} />,
    heading: 'Explore NGOs',
    description: 'Find NGOs working for gau raksha and gau seva',
    searchPlaceholder: 'Search NGOs by name...',
    emptyText: 'No NGOs found',
    profilePath: (id) => `/gaushala/${id}`,
    apiRole: 'NGO',
  },
};

function StarRating({ rating, size = 12 }: { rating: number; size?: number }) {
  const full = Math.floor(rating);
  const half = rating - full >= 0.5;
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 2 }}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          size={size}
          fill={i <= full ? '#F59E0B' : i === full + 1 && half ? '#F59E0B' : 'none'}
          color={i <= full || (i === full + 1 && half) ? '#F59E0B' : '#D1D5DB'}
        />
      ))}
    </span>
  );
}

const BACKEND = 'https://app.gaubook.org';
function resolveImg(url?: string | null): string | undefined {
  if (!url) return undefined;
  if (url.startsWith('http')) return url;
  if (url.startsWith('/')) return `${BACKEND}${url}`;
  return url;
}

function formatDistance(raw: number | string) {
  const km = typeof raw === 'string' ? parseFloat(raw) : raw;
  if (isNaN(km)) return '';
  if (km < 1) return `${Math.round(km * 1000)} m`;
  if (km < 10) return `${km.toFixed(1)} km`;
  return `${Math.round(km)} km`;
}

function UserCardComponent({ u, profilePath }: { u: UserCard; profilePath: string }) {
  const [coverError, setCoverError] = useState(false);
  const [avatarError, setAvatarError] = useState(false);
  const name = u.businessName || u.fullname;
  const location = [u.district, u.state].filter(Boolean).join(', ');
  const badgeStyle = u.badge && BADGE_STYLES[u.badge];
  const coverSrc = resolveImg(Array.isArray(u.coverPhoto) ? u.coverPhoto[0] : u.coverPhoto);
  const avatarSrc = resolveImg(u.profilePhoto);
  const gauVansh = u.totalGauVansh ?? 0;
  const productCount = u.totalProductCount ?? 0;
  const showGauVansh = gauVansh > 0;
  const showProducts = productCount > 0;

  return (
    <div className="card card-hover" style={{ display: 'flex', flexDirection: 'column' }}>
      {/* Cover photo — overflow:hidden is on an inner div so the avatar isn't clipped */}
      <div style={{ position: 'relative', height: 160, flexShrink: 0 }}>
        <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
          {coverSrc && !coverError ? (
            <img src={coverSrc} alt="" onError={() => setCoverError(true)} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
          ) : (
            <div style={{ width: '100%', height: '100%', background: '#FDFAF6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <img src="/logo.png" alt="" style={{ height: 36, opacity: 0.15, objectFit: 'contain', pointerEvents: 'none' }} />
            </div>
          )}
          <div style={{
            position: 'absolute', bottom: 0, left: 0, right: 0, height: 48,
            background: 'linear-gradient(to top, rgba(45,27,14,0.38), transparent)',
            pointerEvents: 'none',
          }} />
        </div>
        {/* Avatar — outside overflow:hidden so it can extend below the cover */}
        <div style={{
          position: 'absolute', bottom: -22, left: 12, zIndex: 2,
          width: 46, height: 46, borderRadius: '50%',
          border: '3px solid white',
          boxShadow: '0 0 0 2px var(--primary)',
          overflow: 'hidden', background: 'var(--primary)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'white', fontWeight: 800, fontSize: 14, flexShrink: 0,
        }}>
          {avatarSrc && !avatarError
            ? <img src={avatarSrc} alt={name} onError={() => setAvatarError(true)} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
            : name.slice(0, 2).toUpperCase()}
        </div>
        {/* Badge top-right */}
        {badgeStyle && (
          <span className="badge" style={{
            position: 'absolute', top: 8, right: 8,
            background: badgeStyle.bg, color: badgeStyle.color,
            fontSize: 10.5, fontWeight: 700,
            boxShadow: '0 1px 6px rgba(0,0,0,0.12)',
          }}>
            {u.badge}
          </span>
        )}
      </div>

      {/* Body */}
      <div style={{ padding: '30px 13px 13px', display: 'flex', flexDirection: 'column', gap: 6, flex: 1 }}>
        <h3 style={{ fontWeight: 700, fontSize: 14, color: 'var(--text)', lineHeight: 1.3, textTransform: 'capitalize', letterSpacing: '-0.2px' }}>
          {name.toLowerCase()}
        </h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          {location && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--text-muted)', minWidth: 0 }}>
              <MapPin size={11} style={{ flexShrink: 0 }} />
              <span style={{ fontSize: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{location}</span>
            </div>
          )}
          {u.distance != null && (
            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--primary)', background: 'var(--primary-light)', borderRadius: 100, padding: '2px 8px', whiteSpace: 'nowrap', flexShrink: 0 }}>
              {formatDistance(u.distance)}
            </span>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          {!!u.avgRating && u.avgRating > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <StarRating rating={u.avgRating} />
              <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>
                {u.avgRating.toFixed(1)}{u.reviewCount ? ` (${u.reviewCount})` : ''}
              </span>
            </div>
          )}
        </div>
        {/* Gau Vansh + Product count chips */}
        {(showGauVansh || showProducts) && (
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {showGauVansh && (
              <span style={{ fontSize: 11, fontWeight: 600, color: '#7B4A1E', background: '#FFF3E4', borderRadius: 100, padding: '2px 8px', whiteSpace: 'nowrap' }}>
                🐄 {gauVansh.toLocaleString()} Gau Vansh
              </span>
            )}
            {showProducts && (
              <span style={{ fontSize: 11, fontWeight: 600, color: '#166534', background: '#DCFCE7', borderRadius: 100, padding: '2px 8px', whiteSpace: 'nowrap' }}>
                🛒 {productCount} Products
              </span>
            )}
          </div>
        )}
        {u.followers_count !== undefined && u.followers_count > 0 && (
          <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>{u.followers_count.toLocaleString()} followers</p>
        )}
        <Link
          href={profilePath}
          className="btn-outline"
          style={{ marginTop: 'auto', paddingTop: 9, paddingBottom: 9, fontSize: 13, borderRadius: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          View Profile
        </Link>
      </div>
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="card" style={{ overflow: 'hidden' }}>
      <div className="skeleton" style={{ aspectRatio: '16/9', width: '100%' }} />
      <div style={{ padding: '28px 12px 12px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div className="skeleton" style={{ height: 14, width: '66%', borderRadius: 6 }} />
        <div className="skeleton" style={{ height: 12, width: '50%', borderRadius: 6 }} />
        <div className="skeleton" style={{ height: 12, width: '75%', borderRadius: 6 }} />
        <div className="skeleton" style={{ height: 32, width: '100%', borderRadius: 10, marginTop: 4 }} />
      </div>
    </div>
  );
}

export default function ExplorePage() {
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

  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => setUserCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => {},
      { timeout: 8000 }
    );
  }, []);

  const config = ROLE_CONFIG[activeRole];

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(t);
  }, [search]);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, unknown> = { page, limit: 12, role: config.apiRole };
      if (debouncedSearch) params.search = debouncedSearch;
      if (stateFilter) params.state = stateFilter;
      if (badgeFilter === 'No Badge') params.badge = '';
      else if (badgeFilter) params.badge = badgeFilter;
      if (userCoords) { params.lat = userCoords.lat; params.lng = userCoords.lng; }

      const res = await exploreApi.getGaushalas(params);
      const raw = res.data;
      let list: UserCard[] = [];
      const inner = raw?.data ?? raw;
      if (Array.isArray(inner?.gaushalas)) list = inner.gaushalas;
      else if (Array.isArray(inner?.users)) list = inner.users;
      else if (Array.isArray(inner)) list = inner;

      setUsers(list);
      const tp = inner?.totalPages || raw?.totalPages || (inner?.total ? Math.ceil(inner.total / 12) : 0) || 1;
      setTotalPages(tp);
    } catch {
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch, stateFilter, badgeFilter, config.apiRole, userCoords]);

  useEffect(() => { setPage(1); setUsers([]); }, [activeRole, debouncedSearch, stateFilter, badgeFilter]);
  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const handleRoleChange = (role: RoleTab) => {
    setActiveRole(role);
    setSearch('');
    setDebouncedSearch('');
    setStateFilter('');
    setBadgeFilter('');
    setPage(1);
  };

  return (
    <div style={{ background: 'var(--canvas)', minHeight: '100vh', paddingBottom: 80 }}>
      <div className="max-w-6xl mx-auto px-4 pt-6">
        <span className="eyebrow">Across India</span>
        <h1 style={{ fontSize: 26, fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.5px', lineHeight: 1.2, marginBottom: 4 }}>
          {config.heading}
        </h1>
        <p style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 20, lineHeight: 1.5 }}>
          {config.description}
        </p>

        {/* Role tabs */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 20 }}>
          {(Object.keys(ROLE_CONFIG) as RoleTab[]).map((role) => {
            const cfg = ROLE_CONFIG[role];
            const active = activeRole === role;
            return (
              <button
                key={role}
                onClick={() => handleRoleChange(role)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '8px 16px', borderRadius: 100,
                  fontSize: 13, fontWeight: 700, cursor: 'pointer', border: 'none',
                  transition: 'all 0.15s',
                  ...(active
                    ? { background: 'var(--primary)', color: 'white', boxShadow: '0 4px 12px rgba(240,123,29,0.25)' }
                    : { background: 'var(--surface)', color: 'var(--text-muted)', border: '1.5px solid var(--border)' }),
                }}
              >
                {cfg.icon}
                {cfg.label}
              </button>
            );
          })}
        </div>

        {/* Search bar */}
        <div style={{ position: 'relative', marginBottom: 14 }}>
          <Search size={17} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
          <input
            className="input"
            type="text"
            placeholder={config.searchPlaceholder}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ paddingLeft: 42, borderRadius: 12, fontSize: 14 }}
          />
        </div>

        {/* Filter row */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 24, flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: '1 1 160px' }}>
            <select
              className="input"
              value={stateFilter}
              onChange={(e) => setStateFilter(e.target.value)}
              style={{ paddingRight: 32, appearance: 'none', cursor: 'pointer' }}
            >
              <option value="">All States</option>
              {INDIAN_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
            <ChevronRight size={14} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%) rotate(90deg)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
          </div>
          {activeRole === 'Gaushala' && (
            <div style={{ position: 'relative', flex: '1 1 140px' }}>
              <select
                className="input"
                value={badgeFilter}
                onChange={(e) => setBadgeFilter(e.target.value)}
                style={{ paddingRight: 32, appearance: 'none', cursor: 'pointer' }}
              >
                <option value="">All Badges</option>
                {BADGE_OPTIONS.map((b) => <option key={b} value={b}>{b}</option>)}
              </select>
              <ChevronRight size={14} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%) rotate(90deg)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
            </div>
          )}
        </div>

        {/* Grid */}
        {loading ? (
          <div className="explore-grid">
            {[1, 2, 3, 4, 5, 6].map((i) => <SkeletonCard key={i} />)}
          </div>
        ) : users.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', paddingTop: 72, paddingBottom: 72, textAlign: 'center' }}>
            <div style={{ width: 88, height: 88, borderRadius: '50%', background: 'linear-gradient(135deg, var(--primary-light), #FFF9F3)', border: '2px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 18 }}>
              {activeRole === 'Vendor' ? <Store size={38} color="var(--primary)" strokeWidth={1.5} /> :
               activeRole === 'Expert' || activeRole === 'NGO' ? <UserCheck size={38} color="var(--primary)" strokeWidth={1.5} /> :
               <Home size={38} color="var(--primary)" strokeWidth={1.5} />}
            </div>
            <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text)', marginBottom: 6, letterSpacing: '-0.3px' }}>
              {config.emptyText}
            </h3>
            <p style={{ fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.55, maxWidth: 240 }}>
              Try adjusting your search or filter criteria
            </p>
          </div>
        ) : (
          <div className="explore-grid">
            {users.map((u) => (
              <UserCardComponent key={u.id} u={u} profilePath={config.profilePath(u.id)} />
            ))}
          </div>
        )}

        {/* Pagination */}
        {!loading && totalPages > 1 && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, marginTop: 32 }}>
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="btn-outline" style={{ fontSize: 13, padding: '8px 16px', display: 'flex', alignItems: 'center', gap: 4 }}>
              <ChevronLeft size={15} /> Prev
            </button>
            <span className="text-sm" style={{ color: 'var(--text-muted)' }}>Page {page} of {totalPages}</span>
            <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="btn-outline" style={{ fontSize: 13, padding: '8px 16px', display: 'flex', alignItems: 'center', gap: 4 }}>
              Next <ChevronRight size={15} />
            </button>
          </div>
        )}
      </div>

      <style>{`
        .explore-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; }
        @media (min-width: 640px) { .explore-grid { grid-template-columns: repeat(3, 1fr); } }
        @media (min-width: 1024px) { .explore-grid { grid-template-columns: repeat(4, 1fr); } }
      `}</style>
    </div>
  );
}
