'use client';

import { useState, useEffect, useCallback } from 'react';
import { Search, Star, MapPin, Users, Award } from 'lucide-react';
import { expertApi } from '@/lib/api';

interface ExpertProfile {
  specialization: string;
  experience: number;
  bio: string;
}

interface Expert {
  id: string;
  fullname: string;
  businessName: string;
  profilePhoto: string;
  state: string;
  district: string;
  avgRating: number;
  reviewCount: number;
  followers_count: number;
  AppUserProfiles: ExpertProfile[];
}

interface Banner {
  id: string;
  imageUrl: string;
  title?: string;
}

function StarRating({ rating }: { rating: number }) {
  const rounded = Math.round(rating || 0);
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          size={12}
          className={
            s <= rounded
              ? 'fill-[#F07B1D] text-[#F07B1D]'
              : 'text-[var(--border)] fill-[var(--border)]'
          }
        />
      ))}
    </div>
  );
}

export default function ExpertPage() {
  const [experts, setExperts] = useState<Expert[]>([]);
  const [banners, setBanners] = useState<Banner[]>([]);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  const fetchExperts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await expertApi.getExperts({
        page,
        limit: 12,
        ...(search ? { search } : {}),
      });
      const d = res.data;
      const inner = d?.data ?? d;
      const rawList = inner?.gaushalas ?? inner?.users ?? (Array.isArray(inner) ? inner : []);
      setExperts(Array.isArray(rawList) ? rawList : []);
      const total = inner?.totalPages ?? d?.totalPages ?? (inner?.total ? Math.ceil(inner.total / 12) : 1);
      setTotalPages(total);
    } catch {
      setExperts([]);
    }
    setLoading(false);
  }, [page, search]);

  useEffect(() => {
    expertApi
      .getBanners()
      .then((r) => setBanners(r.data?.data || r.data?.banners || []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    const t = setTimeout(fetchExperts, search ? 400 : 0);
    return () => clearTimeout(t);
  }, [fetchExperts, search]);

  return (
    <div className="min-h-screen" style={{ background: 'var(--canvas)' }}>
      {/* Banner strip */}
      {banners.length > 0 && (
        <div
          className="flex gap-3 px-4 py-3 overflow-x-auto"
          style={{ scrollbarWidth: 'none' }}
        >
          {banners.map((b) => (
            <img
              key={b.id}
              src={b.imageUrl}
              alt={b.title || 'banner'}
              className="h-28 w-72 shrink-0 rounded-2xl object-cover"
            />
          ))}
        </div>
      )}

      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Header + search */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-6">
          <div>
            <span className="eyebrow">Specialists</span>
            <h1 style={{ fontSize: 26, fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.5px', lineHeight: 1.2, marginTop: 4 }}>
              Expert Directory
            </h1>
            <p style={{ fontSize: 14, color: 'var(--text-muted)', marginTop: 3, lineHeight: 1.5 }}>
              Connect with Gau experts, vets &amp; specialists
            </p>
          </div>
          <div className="relative sm:ml-auto w-full sm:w-72">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]"
              size={18}
            />
            <input
              className="input"
              style={{ paddingLeft: 40 }}
              placeholder="Search experts..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
          </div>
        </div>

        {/* Grid */}
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="card p-5">
                <div
                  className="skeleton mx-auto mb-3 rounded-full"
                  style={{ width: 64, height: 64 }}
                />
                <div className="skeleton h-4 rounded mb-2" />
                <div className="skeleton h-3 rounded w-3/4 mb-1 mx-auto" />
                <div className="skeleton h-3 rounded w-1/2 mx-auto" />
              </div>
            ))}
          </div>
        ) : experts.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-5xl mb-4">🔍</div>
            <p className="font-semibold text-[var(--text)] text-lg">No experts found</p>
            <p className="text-[var(--text-muted)] text-sm mt-1">
              Try a different search term
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {experts.map((expert) => {
              const profile = expert.AppUserProfiles?.[0];
              const name = expert.fullname || expert.businessName || 'Expert';
              const initials = name[0]?.toUpperCase() ?? 'E';
              const location = [expert.district, expert.state]
                .filter(Boolean)
                .join(', ');

              return (
                <div
                  key={expert.id}
                  className="card card-hover p-4 flex flex-col items-center text-center"
                >
                  {/* Avatar with orange ring + specialty accent */}
                  <div style={{ position: 'relative', marginBottom: 12 }}>
                    {expert.profilePhoto ? (
                      <img
                        src={expert.profilePhoto}
                        alt={name}
                        style={{
                          width: 68, height: 68, borderRadius: '50%', objectFit: 'cover',
                          border: '3px solid white',
                          boxShadow: '0 0 0 2.5px var(--primary)',
                        }}
                      />
                    ) : (
                      <div
                        style={{
                          width: 68, height: 68, borderRadius: '50%',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontWeight: 800, fontSize: 22,
                          background: 'linear-gradient(135deg, var(--primary-light), #FFE8D0)',
                          color: 'var(--primary)',
                          border: '3px solid white',
                          boxShadow: '0 0 0 2.5px var(--primary)',
                        }}
                      >
                        {initials}
                      </div>
                    )}
                    {/* Experience badge floating */}
                    {profile?.experience ? (
                      <div style={{
                        position: 'absolute', bottom: -4, right: -4,
                        background: 'var(--gold)',
                        color: 'white',
                        fontSize: 9.5, fontWeight: 800,
                        padding: '2px 5px',
                        borderRadius: 100,
                        border: '1.5px solid white',
                        whiteSpace: 'nowrap',
                      }}>
                        {profile.experience}yr
                      </div>
                    ) : null}
                  </div>

                  <h3 style={{ fontWeight: 700, fontSize: 14, color: 'var(--text)', lineHeight: 1.3, textTransform: 'capitalize', letterSpacing: '-0.2px', marginBottom: 5, width: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {name}
                  </h3>

                  {profile?.specialization && (
                    <span className="badge badge-primary" style={{ fontSize: 10.5, marginBottom: 6, padding: '3px 9px' }}>
                      {profile.specialization}
                    </span>
                  )}

                  {location ? (
                    <p style={{ fontSize: 11.5, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 3, marginBottom: 7 }}>
                      <MapPin size={11} />
                      {location}
                    </p>
                  ) : null}

                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: expert.followers_count > 0 ? 5 : 12 }}>
                    <StarRating rating={expert.avgRating} />
                    <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>
                      {expert.avgRating > 0 ? expert.avgRating.toFixed(1) : ''} ({expert.reviewCount || 0})
                    </span>
                  </div>

                  {expert.followers_count > 0 && (
                    <p style={{ fontSize: 11.5, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 3, marginBottom: 12 }}>
                      <Users size={11} />
                      {expert.followers_count.toLocaleString()} followers
                    </p>
                  )}

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, width: '100%', marginTop: 'auto' }}>
                    <a
                      href={`/expert/${expert.id}`}
                      className="btn-primary w-full"
                      style={{ padding: '9px 16px', fontSize: 13.5, borderRadius: 100, textAlign: 'center', display: 'block' }}
                    >
                      Consult Now
                    </a>
                    <a
                      href={`/expert/${expert.id}`}
                      className="btn-outline w-full"
                      style={{ padding: '9px 16px', fontSize: 13.5, borderRadius: 100, textAlign: 'center', display: 'block' }}
                    >
                      View Profile
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-3 mt-10">
            <button
              disabled={page === 1}
              onClick={() => setPage((p) => p - 1)}
              className="btn-outline disabled:opacity-40"
              style={{ padding: '8px 20px', fontSize: 14 }}
            >
              Previous
            </button>
            <span className="text-sm text-[var(--text-muted)]">
              Page {page} of {totalPages}
            </span>
            <button
              disabled={page === totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="btn-primary disabled:opacity-40"
              style={{ padding: '8px 20px', fontSize: 14 }}
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
