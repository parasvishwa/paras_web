'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Siren, MapPin, Clock, Users, ArrowLeft, ExternalLink, User, Trash2 } from 'lucide-react';
import { rescueApi } from '@/lib/api';
import toast from 'react-hot-toast';
import { AppGateModal } from '@/components/AppGate';
import { getStoredUser } from '@/lib/auth';


interface RescueDetail {
  id: string;
  type: string;
  description: string;
  location?: string;
  address?: string;
  city?: string;
  state?: string;
  district?: string;
  status: string;
  photoUrl?: string;
  photo?: string;
  images?: string[];
  lat?: string | number;
  lng?: string | number;
  latitude?: number;
  longitude?: number;
  createdAt: string;
  distance?: number;
  helpersCount: number;
  resolvedVotes?: number;
  stillThereVotes?: number;
  contact?: string;
  reporter?: { fullname: string; profilePhoto?: string };
  User?: { fullname: string; profilePhoto?: string };
  reporterId?: string;
  userId?: string;
}

const TYPE_CONFIG: Record<string, { label: string; bg: string; color: string; emoji: string }> = {
  injured:            { label: 'Injured',              bg: '#FEE2E2', color: '#DC2626', emoji: '🤕' },
  sick:               { label: 'Sick',                 bg: '#FEE2E2', color: '#DC2626', emoji: '🤒' },
  accident:           { label: 'Accident',             bg: '#FEE2E2', color: '#DC2626', emoji: '🚨' },
  stray:              { label: 'Stray',                bg: '#FEF3C7', color: '#B45309', emoji: '🐄' },
  abandoned:          { label: 'Abandoned',            bg: '#FEF3C7', color: '#B45309', emoji: '😔' },
  illegalTowing:      { label: 'Illegal Towing',       bg: '#FFEDD5', color: '#C2410C', emoji: '⚠️' },
  suspiciousTransport:{ label: 'Suspicious Transport', bg: '#FFEDD5', color: '#C2410C', emoji: '⚠️' },
  dead:               { label: 'Dead',                 bg: '#F1F5F9', color: '#475569', emoji: '🕊️' },
  other:              { label: 'Other',                bg: '#F1F5F9', color: '#475569', emoji: '🆘' },
};

const STATUS_CONFIG: Record<string, { label: string; bg: string; color: string }> = {
  active:     { label: 'Active',      bg: '#DC2626', color: '#fff' },
  inProgress: { label: 'In Progress', bg: '#D97706', color: '#fff' },
  resolved:   { label: 'Rescued',     bg: '#16A34A', color: '#fff' },
  rescued:    { label: 'Rescued',     bg: '#16A34A', color: '#fff' },
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

export default function RescueDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [rescue, setRescue] = useState<RescueDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [appGate, setAppGate] = useState(false);
  const [activePhoto, setActivePhoto] = useState(0);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        const res = await rescueApi.getById(id);
        const d = res.data;
        const report =
          d?.data?.reports?.[0] ??
          d?.data?.report ??
          d?.data ??
          d?.report ??
          d;
        if (!report?.id) { setNotFound(true); }
        else { setRescue(report); }
      } catch {
        setNotFound(true);
      }
      setLoading(false);
    })();
  }, [id]);

  const currentUserId = getStoredUser()?.id;

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await rescueApi.deleteReport(id!);
      router.replace('/rescue');
    } catch {
      toast.error('Failed to delete rescue alert.');
      setDeleting(false);
      setConfirmDelete(false);
    }
  };

  if (loading) return (
    <div style={{ minHeight: '100vh', background: 'var(--canvas)' }}>
      <div style={{ height: 280, background: '#e5e7eb', animation: 'pulse 1.5s ease-in-out infinite' }} />
      <div className="max-w-3xl mx-auto px-4 py-6" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {[200, 120, 80].map((h, i) => (
          <div key={i} style={{ height: h, borderRadius: 12, background: '#e5e7eb', animation: 'pulse 1.5s ease-in-out infinite' }} />
        ))}
      </div>
    </div>
  );

  if (notFound) return (
    <div style={{ minHeight: '100vh', background: 'var(--canvas)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, textAlign: 'center', padding: 32 }}>
      <Siren size={48} color="var(--primary)" strokeWidth={1.5} />
      <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text)' }}>Rescue report not found</h2>
      <p style={{ fontSize: 14, color: 'var(--text-muted)' }}>This report may have been removed.</p>
      <Link href="/rescue" className="btn-primary" style={{ padding: '10px 24px', borderRadius: 100, fontSize: 14 }}>
        Back to Rescue Feed
      </Link>
    </div>
  );

  const r = rescue!;
  const isOwner = currentUserId != null && (currentUserId === r.reporterId || currentUserId === r.userId);
  const typeConf = TYPE_CONFIG[r.type] || TYPE_CONFIG.other;
  const statusConf = STATUS_CONFIG[r.status] || STATUS_CONFIG.active;
  const locationStr = r.address || [r.city, r.district, r.state].filter(Boolean).join(', ');
  const lat = r.lat ?? r.latitude;
  const lng = r.lng ?? r.longitude;
  const hasCoords = lat != null && lng != null && String(lat) !== '' && String(lng) !== '';
  const mapsUrl = hasCoords ? `https://www.google.com/maps/search/?api=1&query=${lat},${lng}` : null;

  const allPhotos: string[] = [];
  if (r.images && r.images.length > 0) allPhotos.push(...r.images);
  else if (r.photoUrl) allPhotos.push(r.photoUrl);
  else if (r.photo) allPhotos.push(r.photo);

  return (
    <div style={{ minHeight: '100vh', background: 'var(--canvas)' }}>
      {appGate && <AppGateModal feature="Rescue Response" onClose={() => setAppGate(false)} />}

      {/* ── Delete confirm dialog ── */}
      {confirmDelete && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 200,
          background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
        }}>
          <div style={{
            background: 'var(--surface)', borderRadius: 20, padding: 28,
            maxWidth: 340, width: '100%',
            boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
          }}>
            <div style={{ width: 48, height: 48, borderRadius: '50%', background: '#FEE2E2', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
              <Trash2 size={22} color="#DC2626" />
            </div>
            <h3 style={{ fontSize: 17, fontWeight: 700, color: 'var(--text)', marginBottom: 8 }}>Delete Rescue Alert?</h3>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: 24 }}>
              This will permanently remove the rescue report. This action cannot be undone.
            </p>
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={() => setConfirmDelete(false)}
                disabled={deleting}
                style={{ flex: 1, padding: '11px', borderRadius: 10, border: '1.5px solid var(--border)', background: 'transparent', fontSize: 14, fontWeight: 600, cursor: 'pointer', color: 'var(--text)' }}
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                style={{ flex: 1, padding: '11px', borderRadius: 10, border: 'none', background: '#DC2626', color: 'white', fontSize: 14, fontWeight: 700, cursor: deleting ? 'not-allowed' : 'pointer', opacity: deleting ? 0.7 : 1 }}
              >
                {deleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Hero photo ─────────────────────────────────────────────────────── */}
      <div style={{ position: 'relative', height: 300, background: '#1a0000', overflow: 'hidden' }}>
        {allPhotos.length > 0 ? (
          <img
            src={allPhotos[activePhoto]}
            alt="rescue"
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          />
        ) : (
          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #3E0000, #E53935)', flexDirection: 'column', gap: 12 }}>
            <span style={{ fontSize: 72 }}>🐄</span>
          </div>
        )}

        {/* Gradient scrim */}
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(0,0,0,0.25) 0%, rgba(0,0,0,0) 40%, rgba(0,0,0,0.55) 100%)' }} />

        {/* Back button */}
        <button
          onClick={() => router.back()}
          style={{
            position: 'absolute', top: 16, left: 16,
            width: 36, height: 36, borderRadius: '50%',
            background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.25)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', backdropFilter: 'blur(8px)',
          }}
        >
          <ArrowLeft size={18} color="white" />
        </button>

        {/* Delete button — only for the reporter */}
        {isOwner && (
          <button
            onClick={() => setConfirmDelete(true)}
            style={{
              position: 'absolute', top: 16, right: 16,
              width: 36, height: 36, borderRadius: '50%',
              background: 'rgba(220,38,38,0.7)', border: '1px solid rgba(255,255,255,0.25)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', backdropFilter: 'blur(8px)',
            }}
          >
            <Trash2 size={16} color="white" />
          </button>
        )}

        {/* Status badge */}
        <div style={{ position: 'absolute', bottom: 16, left: 16 }}>
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 5,
            padding: '5px 12px', borderRadius: 99,
            background: statusConf.bg, color: statusConf.color,
            fontSize: 12, fontWeight: 700,
            boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
          }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'rgba(255,255,255,0.8)', display: r.status?.toLowerCase() === 'active' ? 'block' : 'none' }} />
            {statusConf.label}
          </span>
        </div>

        {/* Photo dots */}
        {allPhotos.length > 1 && (
          <div style={{ position: 'absolute', bottom: 16, left: 0, right: 0, display: 'flex', justifyContent: 'center', gap: 5 }}>
            {allPhotos.map((_, i) => (
              <button
                key={i}
                onClick={() => setActivePhoto(i)}
                style={{
                  width: i === activePhoto ? 16 : 6, height: 6, borderRadius: 3,
                  background: `rgba(255,255,255,${i === activePhoto ? 0.95 : 0.5})`,
                  border: 'none', cursor: 'pointer', padding: 0,
                  transition: 'all 0.2s',
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── Content ────────────────────────────────────────────────────────── */}
      <div className="max-w-3xl mx-auto px-4 py-6" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

        {/* Location card */}
        <div className="card" style={{ padding: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 5,
              padding: '3px 10px', borderRadius: 99,
              background: typeConf.bg, color: typeConf.color,
              fontSize: 11, fontWeight: 700,
            }}>
              {typeConf.emoji} {typeConf.label}
            </span>
            <span style={{ fontSize: 12, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
              <Clock size={11} />
              {timeAgo(r.createdAt)}
            </span>
          </div>

          {locationStr && (
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 6, marginBottom: 14 }}>
              <MapPin size={15} color="#DC2626" style={{ marginTop: 2, flexShrink: 0 }} />
              <p style={{ fontSize: 16, fontWeight: 800, color: 'var(--text)', lineHeight: 1.3, margin: 0 }}>
                {locationStr}
              </p>
            </div>
          )}

          {mapsUrl && (
            <a
              href={mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '10px 16px', borderRadius: 8,
                background: '#DC2626', color: 'white',
                fontSize: 13, fontWeight: 700, textDecoration: 'none',
                boxShadow: '0 4px 12px rgba(220,38,38,0.3)',
              }}
            >
              <MapPin size={14} />
              View on Map
              <ExternalLink size={12} style={{ opacity: 0.8 }} />
            </a>
          )}

          {(r.reporter ?? r.User)?.fullname && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 14, paddingTop: 14, borderTop: '1px solid var(--border)' }}>
              {(r.reporter ?? r.User)?.profilePhoto ? (
                <img src={(r.reporter ?? r.User)?.profilePhoto} alt="" style={{ width: 28, height: 28, borderRadius: '50%', objectFit: 'cover' }} />
              ) : (
                <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <User size={14} color="var(--primary)" />
                </div>
              )}
              <div>
                <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: 0 }}>Reported by</p>
                <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', margin: 0 }}>{(r.reporter ?? r.User)?.fullname}</p>
              </div>
              {r.contact && (
                <a
                  href={`tel:${r.contact}`}
                  style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--primary)', fontWeight: 600, textDecoration: 'none' }}
                >
                  {r.contact}
                </a>
              )}
            </div>
          )}
        </div>

        {/* Description */}
        {r.description && (
          <div className="card" style={{ padding: 20 }}>
            <p style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.8px', textTransform: 'uppercase', marginBottom: 10 }}>
              WHAT HAPPENED
            </p>
            <p style={{ fontSize: 14, color: 'var(--text)', lineHeight: 1.7, margin: 0 }}>
              {r.description}
            </p>
          </div>
        )}

        {/* Helpers count */}
        <div style={{
          padding: 20, borderRadius: 12,
          background: 'rgba(220,38,38,0.05)',
          border: '1px solid rgba(220,38,38,0.14)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12,
        }}>
          <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(220,38,38,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Users size={20} color="#DC2626" />
          </div>
          <div>
            <span style={{ fontSize: 28, fontWeight: 800, color: '#DC2626', lineHeight: 1 }}>{r.helpersCount}</span>
            <span style={{ fontSize: 14, color: 'var(--text-muted)', fontWeight: 500, marginLeft: 8 }}>
              {r.helpersCount === 1 ? 'person responding' : 'people responding'}
            </span>
          </div>
        </div>

        {/* CTA — app gate */}
        {r.status !== 'resolved' && r.status !== 'rescued' && (
          <div className="card" style={{ padding: 20 }}>
            <p style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.8px', textTransform: 'uppercase', marginBottom: 14 }}>
              RESPOND TO THIS RESCUE
            </p>
            <button
              onClick={() => setAppGate(true)}
              className="btn-primary"
              style={{ width: '100%', padding: '14px', borderRadius: 10, fontSize: 15, fontWeight: 700 }}
            >
              I Can Help — Open in App
            </button>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', textAlign: 'center', marginTop: 10, marginBottom: 0 }}>
              Download Gaubook to respond, vote, and post updates
            </p>
          </div>
        )}

        {/* Back to feed */}
        <div style={{ textAlign: 'center', paddingBottom: 24 }}>
          <Link
            href="/rescue"
            className="btn-outline"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '9px 20px', borderRadius: 100, fontSize: 13 }}
          >
            <ArrowLeft size={14} />
            Back to Rescue Feed
          </Link>
        </div>
      </div>
    </div>
  );
}
