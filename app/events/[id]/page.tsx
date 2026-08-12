'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Calendar, MapPin, Users, Phone, ExternalLink, ArrowLeft, Ticket, ChevronRight } from 'lucide-react';
import { eventsApi } from '@/lib/api';
import toast from 'react-hot-toast';
import { AppGateModal } from '@/components/AppGate';
import { isLoggedIn } from '@/lib/auth';

const BACKEND = 'https://app.gaubook.org';
function resolveImg(url?: string | null): string | undefined {
  if (!url) return undefined;
  if (url.startsWith('http')) return url;
  if (url.startsWith('/')) return `${BACKEND}${url}`;
  return url;
}

const EVENT_TYPE_META: Record<string, { emoji: string; label: string; color: string }> = {
  SevaCamp:        { emoji: '🙏', label: 'Seva Camp',        color: '#F07B1D' },
  CowFair:         { emoji: '🐄', label: 'Cow Fair',         color: '#7B4A1E' },
  GaushalaVisit:   { emoji: '🏡', label: 'Gaushala Visit',   color: '#2E7D32' },
  Training:        { emoji: '📚', label: 'Training',         color: '#1565C0' },
  CulturalProgram: { emoji: '🎶', label: 'Cultural Program', color: '#6A1B9A' },
  Other:           { emoji: '📅', label: 'Event',            color: '#455A64' },
};

interface EventDetail {
  id: string;
  title: string;
  description?: string;
  coverImage?: string;
  eventType?: string;
  startDate: string;
  endDate?: string;
  location?: string;
  city?: string;
  state?: string;
  lat?: number;
  lng?: number;
  maxAttendees?: number;
  attendeesCount: number;
  entryFee?: string;
  entryAmount?: number;
  contactNumber?: string;
  registrationLink?: string;
  isAttending?: boolean;
  user?: { id: string; fullname: string; profilePhoto?: string };
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-IN', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });
}
function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true });
}

export default function EventDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = Array.isArray(params?.id) ? params.id[0] : params?.id ?? '';

  const [event, setEvent] = useState<EventDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [appGate, setAppGate] = useState(false);

  useEffect(() => {
    if (!id) return;
    eventsApi.getById(id).then((res) => {
      const raw = res.data;
      const e = raw?.data?.event ?? raw?.event ?? raw?.data ?? raw;
      if (e?.id) setEvent(e);
    }).catch(() => { toast.error('Failed to load event details.'); }).finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div style={{ background: 'var(--canvas)', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: 32, height: 32, borderRadius: '50%', border: '3px solid var(--border)', borderTopColor: 'var(--primary)', animation: 'spin 0.7s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (!event) {
    return (
      <div style={{ background: 'var(--canvas)', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
        <p style={{ fontSize: 18, fontWeight: 700, color: 'var(--text)' }}>Event not found</p>
        <Link href="/" style={{ color: 'var(--primary)', fontWeight: 600, fontSize: 14 }}>← Back to Feed</Link>
      </div>
    );
  }

  const meta = EVENT_TYPE_META[event.eventType ?? ''] ?? EVENT_TYPE_META.Other;
  const color = meta.color;
  const now = Date.now();
  const start = new Date(event.startDate).getTime();
  const end   = event.endDate ? new Date(event.endDate).getTime() : 0;
  const isLive     = start <= now && (end ? end >= now : start > now - 3 * 3600 * 1000);
  const isUpcoming = start > now;
  const statusLabel = isLive ? '● Live Now' : isUpcoming ? 'Upcoming' : 'Past Event';
  const statusColor = isLive ? '#2E7D32' : isUpcoming ? color : '#677294';
  const locationParts = [event.location, event.city, event.state].filter(Boolean);
  const locationStr = locationParts.join(', ');

  return (
    <div style={{ background: 'var(--canvas)', minHeight: '100vh', paddingBottom: 100 }}>
      {appGate && <AppGateModal feature="RSVP to Events" onClose={() => setAppGate(false)} />}

      {/* Hero */}
      <div style={{ position: 'relative', height: 260, background: `linear-gradient(135deg, ${color}E6, ${color}88)` }}>
        {event.coverImage ? (
          <Image src={resolveImg(event.coverImage)!} alt={event.title} fill style={{ objectFit: 'cover' }} />
        ) : (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: 80 }}>{meta.emoji}</span>
          </div>
        )}
        {/* Scrim */}
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.55) 100%)' }} />

        {/* Back button */}
        <button
          onClick={() => router.back()}
          style={{ position: 'absolute', top: 52, left: 14, width: 38, height: 38, borderRadius: '50%', background: 'rgba(0,0,0,0.38)', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', backdropFilter: 'blur(4px)' }}
        >
          <ArrowLeft size={18} color="white" />
        </button>

        {/* Status + type badges */}
        <div style={{ position: 'absolute', bottom: 14, left: 14, display: 'flex', gap: 7 }}>
          <div style={{ background: color, borderRadius: 99, padding: '4px 10px', display: 'flex', alignItems: 'center', gap: 5 }}>
            <span style={{ fontSize: 11 }}>{meta.emoji}</span>
            <span style={{ color: 'white', fontSize: 10, fontWeight: 700 }}>{meta.label}</span>
          </div>
          <div style={{ background: statusColor, borderRadius: 99, padding: '4px 10px' }}>
            <span style={{ color: 'white', fontSize: 10, fontWeight: 700 }}>{statusLabel}</span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth: 640, margin: '0 auto', padding: '0 16px' }}>
        {/* Title */}
        <div style={{ padding: '18px 0 4px' }}>
          <h1 style={{ fontSize: 22, fontWeight: 900, color: 'var(--text)', lineHeight: 1.2, letterSpacing: '-0.4px', marginBottom: 4 }}>
            {event.title}
          </h1>
        </div>

        {/* Date / time card */}
        <InfoCard>
          <InfoRow icon={<Calendar size={15} color={color} />} label="Start" value={`${formatDate(event.startDate)}  ·  ${formatTime(event.startDate)}`} />
          {event.endDate && <InfoRow icon={<Calendar size={15} color={color} />} label="End" value={`${formatDate(event.endDate)}  ·  ${formatTime(event.endDate)}`} />}
        </InfoCard>

        {/* Location card */}
        {locationStr && (
          <InfoCard>
            <InfoRow icon={<MapPin size={15} color={color} />} label="Location" value={locationStr} />
            {event.lat != null && event.lng != null && (
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${event.lat},${event.lng}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 10, padding: '7px 14px', background: `${color}14`, border: `1.5px solid ${color}30`, borderRadius: 10, textDecoration: 'none', color, fontSize: 13, fontWeight: 700 }}
              >
                <MapPin size={13} />
                View on Map
                <ChevronRight size={13} />
              </a>
            )}
          </InfoCard>
        )}

        {/* Capacity / entry card */}
        <InfoCard>
          <InfoRow icon={<Users size={15} color={color} />} label="Attending" value={`${event.attendeesCount} people`} />
          {event.maxAttendees != null && (
            <InfoRow icon={<Users size={15} color={color} />} label="Capacity" value={`${event.maxAttendees} seats`} />
          )}
          <InfoRow
            icon={<Ticket size={15} color={color} />}
            label="Entry"
            value={event.entryFee === 'Paid' ? (event.entryAmount ? `₹${Math.round(event.entryAmount)}` : 'Paid') : 'Free'}
          />
        </InfoCard>

        {/* Description */}
        {event.description && (
          <InfoCard>
            <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 8 }}>About this Event</p>
            <p style={{ fontSize: 14, color: 'var(--text)', lineHeight: 1.65, whiteSpace: 'pre-wrap' }}>{event.description}</p>
          </InfoCard>
        )}

        {/* Contact / registration */}
        {(event.contactNumber || event.registrationLink) && (
          <InfoCard>
            {event.contactNumber && (
              <a href={`tel:${event.contactNumber}`} style={{ textDecoration: 'none', display: 'block' }}>
                <InfoRow icon={<Phone size={15} color={color} />} label="Contact" value={event.contactNumber} />
              </a>
            )}
            {event.registrationLink && /^https?:\/\//i.test(event.registrationLink) && (
              <a href={event.registrationLink} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none', display: 'block', marginTop: event.contactNumber ? 8 : 0 }}>
                <InfoRow icon={<ExternalLink size={15} color={color} />} label="Register" value="Tap to open registration link" />
              </a>
            )}
          </InfoCard>
        )}

        {/* Organizer */}
        {event.user && (
          <InfoCard>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 38, height: 38, borderRadius: '50%', background: `${color}22`, overflow: 'hidden', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {event.user.profilePhoto ? (
                  <Image src={resolveImg(event.user.profilePhoto)!} alt={event.user.fullname} width={38} height={38} style={{ objectFit: 'cover', borderRadius: '50%' }} />
                ) : (
                  <span style={{ fontWeight: 700, fontSize: 15, color }}>{(event.user.fullname[0] ?? 'G').toUpperCase()}</span>
                )}
              </div>
              <div>
                <p style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 1 }}>Organised by</p>
                <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>{event.user.fullname}</p>
              </div>
            </div>
          </InfoCard>
        )}
      </div>

      {/* RSVP bottom bar */}
      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: 'white', borderTop: '1px solid var(--border)', padding: '12px 20px', display: 'flex', alignItems: 'center', gap: 14, zIndex: 50 }}>
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', marginBottom: 1 }}>{event.attendeesCount} attending</p>
          <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>
            {event.maxAttendees != null ? `${event.maxAttendees - event.attendeesCount} seats left` : 'Open event'}
          </p>
        </div>
        <button
          onClick={() => setAppGate(true)}
          style={{
            padding: '12px 28px', borderRadius: 99, background: color, border: 'none',
            color: 'white', fontSize: 14, fontWeight: 800, cursor: 'pointer',
            boxShadow: `0 6px 16px -4px ${color}60`,
          }}
        >
          RSVP — I&apos;m Attending
        </button>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

function InfoCard({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ background: 'white', borderRadius: 14, border: '1px solid var(--border)', padding: 14, marginTop: 10, boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
      {children}
    </div>
  );
}

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div style={{ display: 'flex', gap: 9, alignItems: 'flex-start', padding: '4px 0' }}>
      <div style={{ flexShrink: 0, marginTop: 2 }}>{icon}</div>
      <div>
        <p style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 1 }}>{label}</p>
        <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>{value}</p>
      </div>
    </div>
  );
}
