'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { MapPin, Clock, Users, ChevronLeft, ChevronRight, ChevronUp, AlertCircle } from 'lucide-react';
import { rescueApi } from '@/lib/api';
import { AppGateModal } from '@/components/AppGate';

/* ─── Types ──────────────────────────────────────────────────────────────── */

interface RescueUser {
  fullname: string;
  profilePhoto?: string;
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
  createdAt: string;
  distance?: number;
  reporter?: RescueUser;
  helpersCount: number;
}

/* ─── Constants ──────────────────────────────────────────────────────────── */

const STATUS_FILTERS = [
  { label: '🔴  All', value: '' },
  { label: '🆘  Active', value: 'active' },
  { label: '✅  Rescued', value: 'resolved' },
];

/* Status: Flutter spec colors */
const STATUS_COLOR: Record<string, string> = {
  active: '#E53935',
  inProgress: '#F07B1D',
  resolved: '#2E7D32',
  rescued: '#2E7D32',
  falseAlarm: '#677294',
};
const STATUS_LABEL: Record<string, string> = {
  active: 'Active',
  inProgress: 'Help on way',
  resolved: 'Rescued',
  rescued: 'Rescued',
  falseAlarm: 'False Alarm',
};

/* Type: Flutter spec colors */
const TYPE_COLOR: Record<string, string> = {
  injured: '#E53935',
  sick: '#E53935',
  accident: '#E53935',
  stray: '#F07B1D',
  abandoned: '#F07B1D',
  illegalTowing: '#F07B1D',
  suspiciousTransport: '#F07B1D',
  dead: '#677294',
  other: '#677294',
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

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

/* ─── Skeleton ───────────────────────────────────────────────────────────── */

function SkeletonCard() {
  return (
    <div style={{
      background: '#fff', borderRadius: 20, border: '1px solid #EFE7DC',
      boxShadow: '0 2px 12px rgba(0,0,0,0.04)', overflow: 'hidden',
      display: 'flex', margin: '0 16px 12px',
    }}>
      <div className="skeleton" style={{ width: 100, minHeight: 120, flexShrink: 0 }} />
      <div style={{ flex: 1, padding: 12, display: 'flex', flexDirection: 'column', gap: 7 }}>
        <div className="skeleton" style={{ height: 20, width: 64, borderRadius: 999 }} />
        <div className="skeleton" style={{ height: 12, width: '90%', borderRadius: 6 }} />
        <div className="skeleton" style={{ height: 12, width: '70%', borderRadius: 6 }} />
        <div className="skeleton" style={{ height: 11, width: '55%', borderRadius: 6 }} />
      </div>
    </div>
  );
}

/* ─── SOS Card ───────────────────────────────────────────────────────────── */

function SOSCard({ c }: { c: RescueCase }) {
  const [imgErr, setImgErr] = useState(false);
  const isActive   = c.status === 'active';
  const statusColor = STATUS_COLOR[c.status] ?? '#677294';
  const statusLabel = STATUS_LABEL[c.status] ?? c.status;
  const typeColor  = TYPE_COLOR[c.type]   ?? '#677294';
  const typeLabel  = TYPE_LABEL[c.type]   ?? c.type;
  const location   = c.city || c.address || [c.district, c.state].filter(Boolean).join(', ');

  return (
    <div
      style={{
        background: '#fff', borderRadius: 20,
        border: '1px solid #EFE7DC',
        boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
        overflow: 'hidden', display: 'flex',
        margin: '0 12px 10px',
        transition: 'transform 0.18s, box-shadow 0.18s',
      }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-1px)';
        (e.currentTarget as HTMLDivElement).style.boxShadow = '0 6px 20px rgba(0,0,0,0.08)';
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLDivElement).style.transform = '';
        (e.currentTarget as HTMLDivElement).style.boxShadow = '0 2px 12px rgba(0,0,0,0.04)';
      }}
    >
      {/* ── Image strip (Flutter: 100px fixed width) ── */}
      <div style={{ width: 100, flexShrink: 0, position: 'relative', alignSelf: 'stretch', minHeight: 120 }}>
        {c.photoUrl && !imgErr ? (
          <img
            src={c.photoUrl}
            alt="rescue"
            onError={() => setImgErr(true)}
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          />
        ) : (
          <div style={{
            width: '100%', height: '100%', minHeight: 120,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: `${typeColor}14`,
          }}>
            <span style={{ fontSize: 32 }}>
              {typeLabel === 'Injured' || typeLabel === 'Sick' || typeLabel === 'Accident' ? '🐄' :
               typeLabel === 'Dead' ? '💔' : '🆘'}
            </span>
          </div>
        )}

        {/* Status badge overlay — bottom left, 9px Flutter spec */}
        <div style={{ position: 'absolute', bottom: 8, left: 8 }}>
          <span style={{
            display: 'block',
            background: statusColor, color: 'white',
            fontSize: 9, fontWeight: 700, letterSpacing: 0.2,
            padding: '3px 7px', borderRadius: 999,
            boxShadow: `0 2px 6px ${statusColor}66`,
            textTransform: 'capitalize',
          }}>
            {statusLabel}
          </span>
        </div>

        {/* Pulse dot — top right for active cases */}
        {isActive && (
          <div style={{
            position: 'absolute', top: 8, right: 8,
            width: 10, height: 10, borderRadius: '50%',
            background: '#E53935',
            border: '1.5px solid white',
            boxShadow: '0 0 0 3px rgba(229,57,53,0.3)',
            animation: 'rescuePulse 900ms ease-in-out infinite alternate',
          }} />
        )}
      </div>

      {/* ── Content ── */}
      <div style={{ flex: 1, minWidth: 0, padding: 12 }}>

        {/* Type badge */}
        <span style={{
          display: 'inline-block',
          background: `${typeColor}1A`, color: typeColor,
          fontSize: 11, fontWeight: 700,
          padding: '3px 9px', borderRadius: 999,
          marginBottom: 6,
        }}>
          {typeLabel}
        </span>

        {/* Description */}
        <p style={{
          fontSize: 13, color: '#000', lineHeight: 1.5, marginBottom: 8,
          display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
        }}>
          {c.description}
        </p>

        {/* Meta chips (Flutter: Wrap, spacing 10, runSpacing 3) */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '3px 10px', marginBottom: 8 }}>
          {location && (
            <span style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 11, color: '#677294' }}>
              <MapPin size={11} style={{ flexShrink: 0 }} />
              {location}
            </span>
          )}
          {c.createdAt && (
            <span style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 11, color: '#677294' }}>
              <Clock size={11} style={{ flexShrink: 0 }} />
              {timeAgo(c.createdAt)}
            </span>
          )}
          {c.distance != null && c.distance > 0 && (
            <span style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 11, fontWeight: 600, color: '#F07B1D' }}>
              <MapPin size={11} style={{ flexShrink: 0 }} />
              {c.distance < 1 ? `${Math.round(c.distance * 1000)}m` : `${c.distance.toFixed(1)}km`}
            </span>
          )}
          {c.helpersCount > 0 && (
            <span style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 11, fontWeight: 600, color: '#F07B1D' }}>
              <Users size={11} style={{ flexShrink: 0 }} />
              {c.helpersCount} helping
            </span>
          )}
        </div>

        {/* Reporter row (Flutter: 18px avatar, "Reported by {name}") */}
        {c.reporter?.fullname && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 10 }}>
            {c.reporter.profilePhoto ? (
              <img src={c.reporter.profilePhoto} alt="" style={{ width: 18, height: 18, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
            ) : (
              <div style={{ width: 18, height: 18, borderRadius: '50%', flexShrink: 0, background: 'rgba(240,123,29,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 700, color: '#F07B1D' }}>
                {c.reporter.fullname[0]?.toUpperCase()}
              </div>
            )}
            <span style={{ fontSize: 11, color: '#677294', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              Reported by {c.reporter.fullname}
            </span>
          </div>
        )}

        {/* View Details button only (Flutter: no "I Can Help" on card) */}
        <Link
          href={`/rescue/${c.id}`}
          style={{
            display: 'inline-block',
            border: '1.5px solid #F07B1D', color: '#F07B1D',
            borderRadius: 999, padding: '7px 14px',
            fontSize: 12, fontWeight: 600,
            textDecoration: 'none',
            transition: 'background 0.14s',
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.background = 'rgba(240,123,29,0.06)'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.background = 'transparent'; }}
        >
          View Details
        </Link>
      </div>
    </div>
  );
}

/* ─── Page ───────────────────────────────────────────────────────────────── */

export default function RescuePage() {
  const [cases, setCases]         = useState<RescueCase[]>([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage]           = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading]     = useState(true);
  const [fetchFailed, setFetchFailed] = useState(false);
  const [appGate, setAppGate]     = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const pageRef = useRef<HTMLDivElement>(null);

  /* Scroll-to-top visibility */
  useEffect(() => {
    const onScroll = () => setShowScrollTop(window.scrollY > 200);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });

  const fetchCases = useCallback(async () => {
    setLoading(true);
    setFetchFailed(false);
    try {
      const res = await rescueApi.getAll({ page, limit: 10, ...(statusFilter ? { status: statusFilter } : {}) });
      const d     = res.data;
      const inner = d?.data ?? d;
      setCases(inner?.reports ?? inner?.rescues ?? (Array.isArray(inner) ? inner : []));
      setTotalPages(inner?.totalPages ?? d?.totalPages ?? (inner?.total ? Math.ceil(inner.total / 10) : 1));
    } catch {
      setCases([]);
      setFetchFailed(true);
    }
    setLoading(false);
  }, [page, statusFilter]);

  useEffect(() => { fetchCases(); }, [fetchCases]);

  const setFilter = (val: string) => { setStatusFilter(val); setPage(1); };

  return (
    <div ref={pageRef} style={{ background: 'var(--canvas)', minHeight: '100vh', paddingBottom: 80 }}>
      {appGate && <AppGateModal feature="Report Rescue Alerts" onClose={() => setAppGate(false)} />}

      {/* ── Orange header area — full-bleed bg, inner content capped at 600px ── */}
      <div style={{ background: '#F07B1D' }}>
        <div style={{ maxWidth: 600, margin: '0 auto' }}>

          {/* Banner — 130px, 14px radius */}
          <div style={{ padding: '8px 12px 0' }}>
            <div style={{
              height: 130, borderRadius: 14, overflow: 'hidden',
              background: 'linear-gradient(135deg, #B71C1C 0%, #E53935 100%)',
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center',
              gap: 4,
            }}>
              <p style={{ fontSize: 16, fontWeight: 800, color: 'white', letterSpacing: '-0.2px', textAlign: 'center' }}>
                Gaubook Rescue Network
              </p>
              <p style={{ fontSize: 12, fontWeight: 500, color: 'rgba(255,255,255,0.75)', textAlign: 'center' }}>
                Protecting India's cows — one report at a time.
              </p>
            </div>
          </div>

          {/* CTA */}
          <div style={{ padding: '12px 12px 8px' }}>
            <button
              onClick={() => setAppGate(true)}
              style={{
                width: '100%', padding: '12px', borderRadius: 16,
                background: 'white', color: '#E53935',
                fontSize: 14, fontWeight: 800, letterSpacing: 0.2,
                border: 'none', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                transition: 'transform 0.1s',
              }}
              onMouseDown={e => { (e.currentTarget).style.transform = 'scale(0.97)'; }}
              onMouseUp={e => { (e.currentTarget).style.transform = ''; }}
              onMouseLeave={e => { (e.currentTarget).style.transform = ''; }}
            >
              <AlertCircle size={18} color="#E53935" />
              🆘  Report Rescue Alert
            </button>
          </div>

          {/* Filter chips */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: 8, padding: '4px 12px 12px' }}>
            {STATUS_FILTERS.map((f) => {
              const active = statusFilter === f.value;
              return (
                <button
                  key={f.value}
                  onClick={() => setFilter(f.value)}
                  style={{
                    padding: '6px 14px', borderRadius: 999,
                    fontSize: 11.5, fontWeight: 600,
                    border: `1px solid ${active ? 'transparent' : 'rgba(255,255,255,0.35)'}`,
                    background: active ? 'white' : 'rgba(255,255,255,0.15)',
                    color: active
                      ? (f.value === '' ? '#F07B1D' : f.value === 'active' ? '#E53935' : '#2E7D32')
                      : 'rgba(255,255,255,0.90)',
                    cursor: 'pointer',
                    transition: 'all 0.16s cubic-bezier(0.23,1,0.32,1)',
                    transform: active ? 'scale(1)' : 'scale(0.97)',
                  }}
                >
                  {f.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Rounded-top white cap transition to feed */}
        <div style={{ background: 'var(--canvas)', borderRadius: '18px 18px 0 0', height: 16 }} />
      </div>

      {/* ── Case feed — also capped at 600px ── */}
      <div style={{ maxWidth: 600, margin: '0 auto' }}>
        {loading ? (
          <div>
            {Array.from({ length: 5 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : cases.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', paddingTop: 72, textAlign: 'center', padding: '72px 24px' }}>
            <div style={{ width: 88, height: 88, borderRadius: '50%', background: 'var(--primary-light)', border: '2px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
              <AlertCircle size={38} color="var(--primary)" strokeWidth={1.5} />
            </div>
            {fetchFailed ? (
              <>
                <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text)', marginBottom: 8 }}>Rescue — Coming Soon</h3>
                <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6, maxWidth: 260 }}>
                  The Rescue feature is launching soon on web. Use the Gaubook app to report and track rescue cases right now.
                </p>
              </>
            ) : (
              <>
                <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text)', marginBottom: 8 }}>All cows are safe!</h3>
                <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6, maxWidth: 240, marginBottom: 20 }}>
                  No active rescue cases right now. If you spot a cow in distress, report it immediately.
                </p>
                <button onClick={() => setAppGate(true)} className="btn-primary" style={{ borderRadius: 100, padding: '11px 24px', fontSize: 14 }}>
                  Report a Case
                </button>
              </>
            )}
          </div>
        ) : (
          <div style={{ paddingTop: 4 }}>
            {cases.map((c) => <SOSCard key={c.id} c={c} />)}
          </div>
        )}

        {/* Pagination */}
        {!loading && totalPages > 1 && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, margin: '20px 0 8px' }}>
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="btn-outline" style={{ padding: '8px 14px' }}>
              <ChevronLeft size={16} />
            </button>
            <span style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 500, padding: '0 8px' }}>
              {page} / {totalPages}
            </span>
            <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="btn-primary" style={{ padding: '8px 14px' }}>
              <ChevronRight size={16} />
            </button>
          </div>
        )}
      </div>

      {/* ── Scroll-to-top pill (Flutter spec: white@92%, #EFE7DC border, warm shadow) ── */}
      <div style={{
        position: 'fixed',
        bottom: showScrollTop ? 88 : -48,
        left: '50%', transform: 'translateX(-50%)',
        opacity: showScrollTop ? 1 : 0,
        transition: 'bottom 0.2s cubic-bezier(0.33,1,0.68,1), opacity 0.2s cubic-bezier(0.33,1,0.68,1)',
        zIndex: 40,
        pointerEvents: showScrollTop ? 'auto' : 'none',
      }}>
        <button
          onClick={scrollToTop}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '6px 18px',
            background: 'rgba(255,255,255,0.92)',
            border: '1px solid #EFE7DC',
            borderRadius: 999,
            boxShadow: '0 8px 18px -6px rgba(123,74,30,0.06), 0 1px 4px rgba(123,74,30,0.04)',
            cursor: 'pointer',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
          }}
        >
          <ChevronUp size={22} color="#444648" />
        </button>
      </div>

      {/* Pulse animation keyframes */}
      <style>{`
        @keyframes rescuePulse {
          from { opacity: 1; }
          to   { opacity: 0.35; }
        }
      `}</style>
    </div>
  );
}
