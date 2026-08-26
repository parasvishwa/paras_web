'use client';
import { useEffect, useState } from 'react';
import Image from 'next/image';
import { configApi } from '@/lib/api';

// Module-level flag prevents React StrictMode double-mount from canceling timers
let _splashStarted = false;

export default function SplashScreen() {
  const [visible, setVisible] = useState(false);
  const [fading, setFading] = useState(false);
  const [adminImageUrl, setAdminImageUrl] = useState<string | null>(null);
  const [adminImageError, setAdminImageError] = useState(false);

  useEffect(() => {
    if (_splashStarted) return;
    _splashStarted = true;

    if (sessionStorage.getItem('splash_shown')) return;
    sessionStorage.setItem('splash_shown', '1');

    setVisible(true);

    // Fetch admin splash config; show admin image if configured.
    configApi.getSplash()
      .then((res) => {
        const data = res.data?.data;
        const url: string | undefined = data?.imageUrl;
        const durationMs: number = data?.durationMs ?? 3000;
        if (url && url.length > 0) {
          setAdminImageUrl(url);
          setTimeout(() => setFading(true), durationMs);
          setTimeout(() => setVisible(false), durationMs + 500);
        } else {
          // No admin image — use default branded duration.
          setTimeout(() => setFading(true), 1400);
          setTimeout(() => setVisible(false), 1900);
        }
      })
      .catch(() => {
        // API unavailable — fall back to branded splash.
        setTimeout(() => setFading(true), 1400);
        setTimeout(() => setVisible(false), 1900);
      });
  }, []);

  if (!visible) return null;

  const showAdminSplash = adminImageUrl !== null && !adminImageError;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: '#FFF3E8',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 16,
        transition: 'opacity 0.5s ease',
        opacity: fading ? 0 : 1,
        pointerEvents: fading ? 'none' : 'all',
      }}
    >
      {/* Branded splash — hidden when admin image is present */}
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16,
        transition: 'opacity 0.25s ease',
        opacity: showAdminSplash ? 0 : 1,
        position: showAdminSplash ? 'absolute' : 'relative',
        pointerEvents: 'none',
      }}>
        <div style={{ animation: 'splash-pop 0.4s cubic-bezier(0.34,1.56,0.64,1) both' }}>
          <Image
            src="/logo.png"
            alt="Gaubook"
            width={160}
            height={160}
            style={{ objectFit: 'contain', filter: 'drop-shadow(0 4px 16px rgba(240,123,29,0.18))' }}
            priority
          />
        </div>
        <p style={{
          color: '#F07B1D', fontWeight: 800, fontSize: 32, letterSpacing: '-0.5px',
          animation: 'splash-pop 0.4s 0.1s cubic-bezier(0.34,1.56,0.64,1) both',
        }}>
          Gaubook
        </p>
        <p style={{
          color: '#7B4A1E', fontSize: 14, fontWeight: 500,
          animation: 'splash-pop 0.4s 0.2s cubic-bezier(0.34,1.56,0.64,1) both',
        }}>
          India&apos;s Largest Gau Community
        </p>
      </div>

      {/* Admin splash — 9:16 portrait card */}
      {adminImageUrl && (
        <div style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px 32px',
          opacity: showAdminSplash ? 1 : 0,
          transition: 'opacity 0.35s ease',
        }}>
          <div style={{
            position: 'relative',
            width: '100%',
            maxWidth: 340,
            aspectRatio: '9 / 16',
            borderRadius: 20,
            overflow: 'hidden',
            border: '1.5px solid rgba(196,160,100,0.35)',
            boxShadow: '0 8px 28px rgba(0,0,0,0.10)',
            background: '#fff',
          }}>
            <Image
              src={adminImageUrl}
              alt="Gaubook announcement"
              fill
              style={{ objectFit: 'cover' }}
              priority
              onError={() => setAdminImageError(true)}
            />
          </div>
        </div>
      )}

      <style>{`
        @keyframes splash-pop {
          from { opacity: 0; transform: scale(0.7); }
          to   { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
}
