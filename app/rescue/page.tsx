'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Siren, MapPin, Clock, Users } from 'lucide-react';
import { rescueApi } from '@/lib/api';
import { AppGateModal } from '@/components/AppGate';

interface RescueUser {
  fullname: string;
  profilePhoto: string;
}

interface RescueCase {
  id: string;
  type: string;
  description: string;
  address?: string;
  city?: string;
  district?: string;
  state?: string;
  status: string;
  photoUrl?: string;
  lat?: string | number;
  lng?: string | number;
  createdAt: string;
  distance?: number;
  User: RescueUser;
  helpersCount: number;
}

const STATUS_FILTERS = [
  { label: 'All', value: '' },
  { label: 'Active', value: 'active' },
  { label: 'Rescued', value: 'resolved' },
];

const TYPE_BADGE: Record<string, string> = {
  injured: 'badge badge-danger',
  sick: 'badge badge-danger',
  accident: 'badge badge-danger',
  stray: 'badge badge-warning',
  abandoned: 'badge badge-warning',
  illegalTowing: 'badge badge-warning',
  suspiciousTransport: 'badge badge-warning',
  dead: 'badge',
  other: 'badge',
};

const TYPE_LABEL: Record<string, string> = {
  injured: 'Injured',
  sick: 'Sick',
  accident: 'Accident',
  stray: 'Stray',
  abandoned: 'Abandoned',
  illegalTowing: 'Illegal Towing',
  suspiciousTransport: 'Suspicious Transport',
  dead: 'Dead',
  other: 'Other',
};

const STATUS_BADGE: Record<string, string> = {
  active: 'badge badge-danger',
  inProgress: 'badge badge-warning',
  resolved: 'badge badge-success',
  rescued: 'badge badge-success',
};

const STATUS_LABEL: Record<string, string> = {
  active: 'Active',
  inProgress: 'In Progress',
  resolved: 'Rescued',
  rescued: 'Rescued',
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

export default function RescuePage() {
  const [cases, setCases] = useState<RescueCase[]>([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [appGate, setAppGate] = useState(false);

  const fetchCases = useCallback(async () => {
    setLoading(true);
    try {
      const res = await rescueApi.getAll({
        page,
        limit: 10,
        ...(statusFilter ? { status: statusFilter } : {}),
      });
      const d = res.data;
      const inner = d?.data ?? d;
      setCases(inner?.reports ?? inner?.rescues ?? (Array.isArray(inner) ? inner : []));
      const total = inner?.totalPages ?? d?.totalPages ?? (inner?.total ? Math.ceil(inner.total / 10) : 1);
      setTotalPages(total);
    } catch {
      setCases([]);
    }
    setLoading(false);
  }, [page, statusFilter]);

  useEffect(() => {
    fetchCases();
  }, [fetchCases]);

  const handleHelp = () => {
    setAppGate(true);
  };

  return (
    <div className="min-h-screen" style={{ background: 'var(--canvas)' }}>
      {appGate && (
        <AppGateModal
          feature="Report Rescue Alerts"
          onClose={() => setAppGate(false)}
        />
      )}
      {/* Hero header */}
      <div className="hero-gradient">
        <div className="max-w-6xl mx-auto px-4 py-10 flex items-center justify-between" style={{ position: 'relative', zIndex: 1 }}>
          <div>
            <span className="eyebrow" style={{ background: 'rgba(255,255,255,0.18)', color: 'white', marginBottom: 10 }}>
              Emergency Response
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
              <Siren size={26} style={{ color: 'white', opacity: 0.9 }} />
              <h1 style={{ fontSize: 30, fontWeight: 800, color: 'white', letterSpacing: '-0.6px', lineHeight: 1.15, margin: 0 }}>
                Gau Rescue
              </h1>
            </div>
            <p style={{ color: 'rgba(255,255,255,0.88)', fontSize: 15, fontWeight: 600, marginBottom: 2 }}>
              गावो विश्वस्य मातरः
            </p>
            <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: 12, marginBottom: 22 }}>
              Cows are the mothers of the universe
            </p>
            <button
              onClick={() => setAppGate(true)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                fontWeight: 700,
                color: 'var(--primary)',
                background: 'white',
                borderRadius: 100,
                padding: '11px 22px',
                fontSize: 14,
                boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
                border: 'none',
                cursor: 'pointer',
                letterSpacing: '-0.1px',
              }}
            >
              <Siren size={16} />
              Report Rescue Alert
            </button>
          </div>
          {/* Rescue illustration */}
          <div
            className="hidden sm:flex w-32 h-32 rounded-full items-center justify-center shrink-0"
            style={{ background: 'rgba(255,255,255,0.12)', border: '2px solid rgba(255,255,255,0.2)' }}
          >
            <Siren size={52} color="white" strokeWidth={1.5} />
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Filter pills */}
        <div className="flex gap-2 mb-6 flex-wrap">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => {
                setStatusFilter(f.value);
                setPage(1);
              }}
              className={`filter-pill${statusFilter === f.value ? ' active' : ''}`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Cases list */}
        {loading ? (
          <div className="flex flex-col gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="card p-4 flex gap-4">
                <div className="skeleton w-24 h-24 rounded-xl shrink-0" />
                <div className="flex-1">
                  <div className="skeleton h-4 rounded mb-2 w-1/3" />
                  <div className="skeleton h-3 rounded mb-1" />
                  <div className="skeleton h-3 rounded w-3/4" />
                </div>
              </div>
            ))}
          </div>
        ) : cases.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', paddingTop: 72, paddingBottom: 72, textAlign: 'center' }}>
            <div
              style={{
                width: 96, height: 96, borderRadius: '50%',
                background: 'linear-gradient(135deg, var(--primary-light), #FFF9F3)',
                border: '2px solid var(--border)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                marginBottom: 20,
              }}
            >
              <Siren size={44} color="var(--primary)" strokeWidth={1.5} />
            </div>
            <h3 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text)', marginBottom: 8, letterSpacing: '-0.3px' }}>
              All cows are safe!
            </h3>
            <p style={{ fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.6, maxWidth: 260, marginBottom: 20 }}>
              No active rescue cases right now. If you spot a cow in distress, report it immediately.
            </p>
            <button onClick={() => setAppGate(true)} className="btn-primary" style={{ borderRadius: 100, padding: '11px 24px', fontSize: 14 }}>
              Report a Case
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {cases.map((c) => {
              const locationStr = c.address || [c.city, c.district, c.state].filter(Boolean).join(', ');
              return (
                <div key={c.id} className="card card-hover" style={{ padding: 0, display: 'flex', gap: 0, overflow: 'hidden' }}>
                  {/* Photo strip */}
                  <div style={{ width: 100, minHeight: 110, flexShrink: 0, background: 'var(--canvas)', overflow: 'hidden', position: 'relative' }}>
                    {c.photoUrl ? (
                      <img
                        src={c.photoUrl}
                        alt="rescue"
                        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                      />
                    ) : (
                      <div style={{ width: '100%', height: '100%', minHeight: 110, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--primary-light)' }}>
                        <Siren size={32} color="var(--primary)" strokeWidth={1.5} />
                      </div>
                    )}
                    {/* Status overlay */}
                    <div style={{ position: 'absolute', bottom: 6, left: 6 }}>
                      <span className={STATUS_BADGE[c.status] || 'badge'} style={{ fontSize: 9.5, padding: '2px 6px', boxShadow: '0 1px 4px rgba(0,0,0,0.15)' }}>
                        {STATUS_LABEL[c.status] || c.status}
                      </span>
                    </div>
                  </div>

                  {/* Content */}
                  <div style={{ flex: 1, minWidth: 0, padding: '12px 14px' }}>
                    {/* Type badge */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                      <span className={TYPE_BADGE[c.type] || 'badge'} style={{ fontSize: 11 }}>
                        {TYPE_LABEL[c.type] || c.type}
                      </span>
                    </div>

                    <p style={{ fontSize: 13.5, color: 'var(--text)', lineHeight: 1.5, marginBottom: 8, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                      {c.description}
                    </p>

                    <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '4px 12px', fontSize: 11.5, color: 'var(--text-muted)', marginBottom: 8 }}>
                      {locationStr && (
                        <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                          <MapPin size={11} />
                          {locationStr}
                        </span>
                      )}
                      {c.distance != null && c.distance > 0 && (
                        <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                          <MapPin size={11} />
                          {c.distance < 1
                            ? `${(c.distance * 1000).toFixed(0)}m`
                            : `${c.distance.toFixed(1)}km`}{' '}
                          away
                        </span>
                      )}
                      {c.createdAt && (
                        <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                          <Clock size={11} />
                          {timeAgo(c.createdAt)}
                        </span>
                      )}
                      {c.helpersCount > 0 && (
                        <span style={{ display: 'flex', alignItems: 'center', gap: 3, color: 'var(--primary)', fontWeight: 600 }}>
                          <Users size={11} />
                          {c.helpersCount} helper{c.helpersCount !== 1 ? 's' : ''}
                        </span>
                      )}
                    </div>

                    {/* Reporter */}
                    {c.User?.fullname && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
                        {c.User.profilePhoto ? (
                          <img
                            src={c.User.profilePhoto}
                            alt=""
                            style={{ width: 18, height: 18, borderRadius: '50%', objectFit: 'cover' }}
                          />
                        ) : (
                          <div
                            style={{
                              width: 18, height: 18, borderRadius: '50%',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              fontSize: 9, fontWeight: 800,
                              background: 'var(--primary-light)', color: 'var(--primary)',
                            }}
                          >
                            {c.User.fullname[0]?.toUpperCase()}
                          </div>
                        )}
                        <span style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>
                          Reported by {c.User.fullname}
                        </span>
                      </div>
                    )}

                    {/* Actions */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Link
                        href={`/rescue/${c.id}`}
                        className="btn-outline"
                        style={{ padding: '6px 14px', fontSize: 12.5, borderRadius: 100 }}
                      >
                        View Details
                      </Link>
                      {c.status === 'active' && (
                        <button
                          onClick={handleHelp}
                          className="btn-primary"
                          style={{ padding: '6px 14px', fontSize: 12.5, borderRadius: 100 }}
                        >
                          I Can Help
                        </button>
                      )}
                    </div>
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
