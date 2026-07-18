'use client';

import Image from 'next/image';
import { X, Smartphone } from 'lucide-react';

interface AppGateModalProps {
  onClose: () => void;
  feature?: string;
}

export function AppGateModal({ onClose, feature }: AppGateModalProps) {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1000,
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center',
        padding: '0 0 env(safe-area-inset-bottom)',
        background: 'rgba(0,0,0,0.5)',
        backdropFilter: 'blur(4px)',
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        style={{
          background: 'var(--surface)',
          borderRadius: '24px 24px 0 0',
          padding: '28px 24px 36px',
          width: '100%',
          maxWidth: 480,
          position: 'relative',
          animation: 'gate-slide-up 0.3s cubic-bezier(0.32,0.72,0,1) both',
        }}
      >
        {/* Close */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: 16,
            right: 16,
            width: 32,
            height: 32,
            borderRadius: '50%',
            background: 'var(--canvas)',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--text-muted)',
          }}
        >
          <X size={16} />
        </button>

        {/* Logo + icon */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, marginBottom: 20 }}>
          <div
            style={{
              width: 72,
              height: 72,
              borderRadius: 20,
              background: 'var(--primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 8px 24px rgba(240,123,29,0.35)',
            }}
          >
            <Image src="/logo.png" alt="Gaubook" width={52} height={52} style={{ objectFit: 'contain' }} />
          </div>
          <Image src="/wordmark.png" alt="Gaubook" width={120} height={32} style={{ objectFit: 'contain' }} />
        </div>

        {/* Heading */}
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: 'var(--text)', marginBottom: 8, letterSpacing: '-0.3px' }}>
            {feature ? `${feature} on the App` : 'Available on the App'}
          </h2>
          <p style={{ fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.5 }}>
            {feature
              ? `To ${feature.toLowerCase()}, download the Gaubook app. The full experience — including posting, rescue alerts, and live community — is on the app.`
              : 'This feature is available on the Gaubook mobile app. Download it to access the full experience.'}
          </p>
        </div>

        {/* Download buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <a
            href="https://play.google.com/store/apps/details?id=com.gaubook.app"
            target="_blank"
            rel="noreferrer"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 10,
              background: '#1a1a2e',
              color: 'white',
              borderRadius: 14,
              padding: '14px 20px',
              textDecoration: 'none',
              fontWeight: 700,
              fontSize: 15,
            }}
          >
            {/* Google Play icon */}
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <path d="M3.18 23.92c.41.23.88.24 1.31.04L16.6 12 13.04 8.44 3.18 23.92z" fill="#EA4335"/>
              <path d="M20.89 10.63L17.9 8.96 14.18 12l3.72 3.04 3.01-1.67a1.6 1.6 0 0 0 0-2.74z" fill="#FBBC04"/>
              <path d="M3.18.08C2.83.25 2.6.6 2.6 1.06V22.94c0 .46.23.81.58.98L14.18 12 3.18.08z" fill="#34A853"/>
              <path d="M3.18 23.92L14.18 12 4.49.12A1.38 1.38 0 0 0 3.18.08L3.18 23.92z" fill="#4285F4"/>
            </svg>
            Download on Google Play
          </a>

          <a
            href="https://apps.apple.com/app/gaubook/id6742472683"
            target="_blank"
            rel="noreferrer"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 10,
              background: '#1a1a1a',
              color: 'white',
              borderRadius: 14,
              padding: '14px 20px',
              textDecoration: 'none',
              fontWeight: 700,
              fontSize: 15,
            }}
          >
            {/* Apple icon */}
            <svg width="22" height="22" viewBox="0 0 24 24" fill="white">
              <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
            </svg>
            Download on the App Store
          </a>
        </div>

        <p style={{ textAlign: 'center', fontSize: 12, color: 'var(--text-muted)', marginTop: 14 }}>
          Free to download · India&apos;s Largest Gau Community
        </p>
      </div>

      <style>{`
        @keyframes gate-slide-up {
          from { transform: translateY(100%); opacity: 0.8; }
          to   { transform: translateY(0);    opacity: 1; }
        }
      `}</style>
    </div>
  );
}

/** Full-page variant — use as the body of /rescue/new and /products/new */
export function AppGatePage({ feature, description }: { feature: string; description: string }) {
  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--canvas)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px 24px',
      }}
    >
      {/* Orange blob */}
      <div
        style={{
          width: 96,
          height: 96,
          borderRadius: 28,
          background: 'var(--primary)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 20,
          boxShadow: '0 12px 40px rgba(240,123,29,0.35)',
        }}
      >
        <Smartphone size={44} color="white" strokeWidth={1.5} />
      </div>

      <Image src="/wordmark.png" alt="Gaubook" width={140} height={38} style={{ objectFit: 'contain', marginBottom: 24 }} />

      <h1 style={{ fontSize: 24, fontWeight: 800, color: 'var(--text)', textAlign: 'center', letterSpacing: '-0.5px', marginBottom: 12 }}>
        {feature} on the App
      </h1>
      <p style={{ fontSize: 15, color: 'var(--text-muted)', textAlign: 'center', lineHeight: 1.6, maxWidth: 340, marginBottom: 32 }}>
        {description}
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, width: '100%', maxWidth: 360 }}>
        <a
          href="https://play.google.com/store/apps/details?id=com.gaubook.app"
          target="_blank"
          rel="noreferrer"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 10,
            background: '#1a1a2e',
            color: 'white',
            borderRadius: 16,
            padding: '16px 24px',
            textDecoration: 'none',
            fontWeight: 700,
            fontSize: 16,
          }}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <path d="M3.18 23.92c.41.23.88.24 1.31.04L16.6 12 13.04 8.44 3.18 23.92z" fill="#EA4335"/>
            <path d="M20.89 10.63L17.9 8.96 14.18 12l3.72 3.04 3.01-1.67a1.6 1.6 0 0 0 0-2.74z" fill="#FBBC04"/>
            <path d="M3.18.08C2.83.25 2.6.6 2.6 1.06V22.94c0 .46.23.81.58.98L14.18 12 3.18.08z" fill="#34A853"/>
            <path d="M3.18 23.92L14.18 12 4.49.12A1.38 1.38 0 0 0 3.18.08L3.18 23.92z" fill="#4285F4"/>
          </svg>
          Download on Google Play
        </a>

        <a
          href="https://apps.apple.com/app/gaubook/id6742472683"
          target="_blank"
          rel="noreferrer"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 10,
            background: '#1a1a1a',
            color: 'white',
            borderRadius: 16,
            padding: '16px 24px',
            textDecoration: 'none',
            fontWeight: 700,
            fontSize: 16,
          }}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="white">
            <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
          </svg>
          Download on the App Store
        </a>

        <a
          href="/"
          style={{
            display: 'block',
            textAlign: 'center',
            padding: '12px',
            fontSize: 14,
            color: 'var(--text-muted)',
            textDecoration: 'none',
            fontWeight: 600,
          }}
        >
          ← Back to Gaubook
        </a>
      </div>

      <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 24, textAlign: 'center' }}>
        Free to download · India&apos;s Largest Gau Community
      </p>
    </div>
  );
}
