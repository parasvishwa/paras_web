'use client';
import { useEffect, useState } from 'react';
import Image from 'next/image';

// Module-level flag prevents React StrictMode double-mount from canceling timers
let _splashStarted = false;

export default function SplashScreen() {
  const [visible, setVisible] = useState(false);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    if (_splashStarted) return;
    _splashStarted = true;

    if (sessionStorage.getItem('splash_shown')) return;
    sessionStorage.setItem('splash_shown', '1');

    setVisible(true);
    setTimeout(() => setFading(true), 1400);
    setTimeout(() => setVisible(false), 1900);
  }, []);

  if (!visible) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: '#FDFAF6',
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
      <style>{`
        @keyframes splash-pop {
          from { opacity: 0; transform: scale(0.7); }
          to   { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
}
