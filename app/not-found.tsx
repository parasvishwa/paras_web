import Link from 'next/link';

export default function NotFound() {
  return (
    <div
      style={{
        minHeight: '80vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px 24px',
        textAlign: 'center',
        background: 'var(--canvas)',
      }}
    >
      <div
        style={{
          width: 80,
          height: 80,
          borderRadius: '50%',
          background: 'var(--primary-light)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 24,
          fontSize: 36,
        }}
      >
        🐄
      </div>

      <p
        style={{
          fontSize: 13,
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '1.2px',
          color: 'var(--primary)',
          marginBottom: 10,
        }}
      >
        404 — Page not found
      </p>

      <h1
        style={{
          fontSize: 26,
          fontWeight: 800,
          color: 'var(--text)',
          lineHeight: 1.2,
          letterSpacing: '-0.5px',
          marginBottom: 10,
          maxWidth: 340,
        }}
      >
        This page wandered off
      </h1>

      <p
        style={{
          fontSize: 14,
          color: 'var(--text-muted)',
          marginBottom: 32,
          maxWidth: 320,
          lineHeight: 1.6,
        }}
      >
        The page you are looking for does not exist or has been moved.
      </p>

      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
        <Link
          href="/"
          style={{
            padding: '10px 24px',
            borderRadius: 100,
            background: 'var(--primary)',
            color: 'white',
            fontSize: 14,
            fontWeight: 700,
            textDecoration: 'none',
          }}
        >
          Go home
        </Link>
        <Link
          href="/explore"
          style={{
            padding: '10px 22px',
            borderRadius: 100,
            border: '1.5px solid var(--border)',
            color: 'var(--text)',
            fontSize: 14,
            fontWeight: 600,
            textDecoration: 'none',
          }}
        >
          Browse gaushalas
        </Link>
      </div>
    </div>
  );
}
