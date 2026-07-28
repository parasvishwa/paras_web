'use client';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import {
  Home, Compass, ShoppingBag, UserCheck, Cross,
  User, Bell, LogOut, ChevronDown, Plus, X, Menu,
} from 'lucide-react';
import { clearAuth, getStoredUser, isLoggedIn, type GbUser } from '@/lib/auth';

const BASE_NAV = [
  { href: '/', icon: Home, label: 'Home' },
  { href: '/explore', icon: Compass, label: 'Explore' },
  { href: '/market', icon: ShoppingBag, label: 'Market' },
  { href: '/expert', icon: UserCheck, label: 'Expert' },
];

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<GbUser | null>(null);
  const [loggedIn, setLoggedIn] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [appBanner, setAppBanner] = useState(false);
  const [showRescue, setShowRescue] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const NAV = showRescue
    ? [...BASE_NAV, { href: '/rescue', icon: Cross, label: 'Rescue' }]
    : BASE_NAV;

  useEffect(() => {
    setUser(getStoredUser());
    setLoggedIn(isLoggedIn());
  }, [pathname]);

  useEffect(() => {
    fetch('/api/proxy/rescue?page=1&limit=1')
      .then((r) => r.json())
      .then((json) => {
        const items = json?.data ?? json?.posts ?? json?.items ?? [];
        if (Array.isArray(items) && items.length > 0) setShowRescue(true);
      })
      .catch(() => {});
  }, []);

  // Show app banner on mobile devices
  useEffect(() => {
    const ua = navigator.userAgent;
    const isMobile = /Android|iPhone|iPad|iPod/i.test(ua);
    const dismissed = sessionStorage.getItem('app_banner_dismissed');
    if (isMobile && !dismissed) setAppBanner(true);
  }, []);

  // Close user menu on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const logout = () => {
    clearAuth();
    router.push('/login');
    setUserMenuOpen(false);
  };

  const dismissBanner = () => {
    sessionStorage.setItem('app_banner_dismissed', '1');
    setAppBanner(false);
  };

  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname.startsWith(href);

  return (
    <>
      {/* ── Mobile App Download Banner ── */}
      {appBanner && (
        <div
          style={{
            background: '#1a1a1a',
            color: 'white',
            padding: '10px 16px',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            position: 'sticky',
            top: 0,
            zIndex: 60,
          }}
        >
          <Image src="/logo.png" alt="Gaubook" width={36} height={36} style={{ borderRadius: 8 }} />
          <div style={{ flex: 1 }}>
            <p style={{ fontWeight: 700, fontSize: 13, lineHeight: 1.2 }}>Gaubook App</p>
            <p style={{ fontSize: 11, color: '#aaa', marginTop: 2 }}>Better experience on the app</p>
          </div>
          <a
            href="https://play.google.com/store/apps/details?id=com.gaubook.app"
            target="_blank"
            rel="noreferrer"
            style={{
              background: 'var(--primary)',
              color: 'white',
              padding: '6px 14px',
              borderRadius: 20,
              fontSize: 12,
              fontWeight: 700,
              textDecoration: 'none',
              flexShrink: 0,
            }}
          >
            Open App
          </a>
          <button
            onClick={dismissBanner}
            style={{ color: '#aaa', padding: 4, background: 'none', border: 'none', cursor: 'pointer' }}
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* ── Top Navigation Bar ── */}
      <nav
        style={{
          position: 'sticky',
          top: appBanner ? 58 : 0,
          zIndex: 50,
          background: 'rgba(248, 245, 240, 0.92)',
          backdropFilter: 'blur(14px)',
          WebkitBackdropFilter: 'blur(14px)',
          borderBottom: '1px solid var(--border)',
          boxShadow: '0 1px 8px rgba(120, 65, 20, 0.07)',
        }}
      >
        <div
          style={{
            maxWidth: 1200,
            margin: '0 auto',
            padding: '0 16px',
            height: 60,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          {/* Logo — full wordmark */}
          <Link href="/" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none', flexShrink: 0, marginRight: 8 }}>
            <Image
              src="/wordmark.png"
              alt="Gaubook"
              width={148}
              height={40}
              style={{ objectFit: 'contain', objectPosition: 'left center' }}
              priority
            />
          </Link>

          {/* Desktop nav links */}
          <div style={{ display: 'none', alignItems: 'center', gap: 2, flex: 1 }} className="desktop-nav">
            {NAV.map(({ href, icon: Icon, label }) => {
              const active = isActive(href);
              return (
                <Link
                  key={href}
                  href={href}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '8px 14px',
                    borderRadius: 10,
                    fontSize: 14,
                    fontWeight: 600,
                    textDecoration: 'none',
                    transition: 'all 0.15s',
                    background: active ? 'var(--primary-light)' : 'transparent',
                    color: active ? 'var(--primary)' : 'var(--text-muted)',
                    boxShadow: active ? 'inset 0 -2px 0 var(--primary)' : 'none',
                    letterSpacing: '-0.1px',
                  }}
                >
                  <Icon size={15} />
                  {label}
                </Link>
              );
            })}
          </div>

          <div style={{ flex: 1 }} className="mobile-spacer" />

          {/* Right actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {loggedIn ? (
              <>
                <Link
                  href="/products/new"
                  className="desktop-only-flex"
                  style={{
                    display: 'none',
                    alignItems: 'center',
                    gap: 6,
                    background: 'var(--primary)',
                    color: 'white',
                    padding: '8px 14px',
                    borderRadius: 10,
                    fontSize: 13,
                    fontWeight: 700,
                    textDecoration: 'none',
                  }}
                >
                  <Plus size={15} /> Add Product
                </Link>

                <button
                  style={{ padding: 8, borderRadius: 8, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
                >
                  <Bell size={20} />
                </button>

                {/* User avatar / menu */}
                <div style={{ position: 'relative' }} ref={menuRef}>
                  <button
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      padding: 4,
                      borderRadius: 8,
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                    }}
                  >
                    {user?.profilePhoto ? (
                      <img src={user.profilePhoto} alt="" style={{ width: 34, height: 34, borderRadius: '50%', objectFit: 'cover', border: '2.5px solid var(--primary)', outline: '1px solid var(--primary-light)', outlineOffset: 1 }} />
                    ) : (
                      <div
                        style={{
                          width: 34, height: 34, borderRadius: '50%',
                          background: 'var(--primary-light)',
                          border: '2px solid var(--primary)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}
                      >
                        <User size={15} color="var(--primary)" />
                      </div>
                    )}
                    <ChevronDown size={13} color="var(--text-muted)" />
                  </button>

                  {userMenuOpen && (
                    <div
                      style={{
                        position: 'absolute',
                        right: 0,
                        top: 'calc(100% + 10px)',
                        width: 210,
                        background: 'rgba(248, 245, 240, 0.98)',
                        backdropFilter: 'blur(20px)',
                        WebkitBackdropFilter: 'blur(20px)',
                        borderRadius: 16,
                        boxShadow: '0 12px 40px rgba(120, 65, 20, 0.16), 0 2px 8px rgba(0,0,0,0.06)',
                        border: '1px solid var(--border)',
                        overflow: 'hidden',
                        zIndex: 100,
                      }}
                    >
                      <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)', background: 'var(--primary-light)' }}>
                        <p style={{ fontWeight: 700, fontSize: 14, color: 'var(--text)', textTransform: 'capitalize', letterSpacing: '-0.2px' }}>
                          {(user?.fullname || user?.businessName || 'My Account').toLowerCase()}
                        </p>
                        <p style={{ fontSize: 12, color: 'var(--primary)', marginTop: 2, fontWeight: 600 }}>
                          {Array.isArray(user?.role) ? user?.role[0] : user?.role}
                        </p>
                      </div>
                      <Link
                        href="/profile"
                        onClick={() => setUserMenuOpen(false)}
                        style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', fontSize: 13, color: 'var(--text)', textDecoration: 'none' }}
                      >
                        <User size={15} /> Profile
                      </Link>
                      <Link
                        href="/products/new"
                        onClick={() => setUserMenuOpen(false)}
                        style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', fontSize: 13, color: 'var(--text)', textDecoration: 'none' }}
                      >
                        <Plus size={15} /> Add Product
                      </Link>
                      <button
                        onClick={logout}
                        style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', fontSize: 13, color: '#e53e3e', background: 'none', border: 'none', width: '100%', cursor: 'pointer' }}
                      >
                        <LogOut size={15} /> Logout
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div style={{ display: 'flex', gap: 8 }}>
                <Link
                  href="/login"
                  style={{
                    padding: '8px 16px',
                    borderRadius: 10,
                    border: '1.5px solid var(--border)',
                    fontSize: 13,
                    fontWeight: 600,
                    color: 'var(--text)',
                    textDecoration: 'none',
                  }}
                >
                  Login
                </Link>
                <Link
                  href="/register"
                  style={{
                    padding: '8px 16px',
                    borderRadius: 10,
                    background: 'var(--primary)',
                    color: 'white',
                    fontSize: 13,
                    fontWeight: 700,
                    textDecoration: 'none',
                  }}
                >
                  Register
                </Link>
              </div>
            )}

            {/* Hamburger for desktop overflow (hidden on true mobile since we have bottom nav) */}
            <button
              className="desktop-hamburger"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              style={{ display: 'none', padding: 8, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
            >
              {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>

        {/* Desktop overflow menu */}
        {mobileMenuOpen && (
          <div
            style={{
              borderTop: '1px solid var(--border)',
              background: 'white',
              padding: '8px 0',
            }}
            className="desktop-hamburger-menu"
          >
            {NAV.map(({ href, icon: Icon, label }) => (
              <Link
                key={href}
                href={href}
                onClick={() => setMobileMenuOpen(false)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '12px 20px',
                  fontSize: 14,
                  fontWeight: 600,
                  textDecoration: 'none',
                  color: isActive(href) ? 'var(--primary)' : 'var(--text-muted)',
                  background: isActive(href) ? 'var(--primary-light)' : 'transparent',
                }}
              >
                <Icon size={18} /> {label}
              </Link>
            ))}
          </div>
        )}
      </nav>

      {/* ── Mobile Bottom Navigation Bar ── */}
      <div
        className="mobile-bottom-nav"
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 50,
          background: 'white',
          borderTop: '1px solid var(--border)',
          boxShadow: '0 -2px 12px rgba(0,0,0,0.08)',
          display: 'none',
          paddingBottom: 'env(safe-area-inset-bottom)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'stretch' }}>
          {NAV.map(({ href, icon: Icon, label }) => {
            const active = isActive(href);
            return (
              <Link
                key={href}
                href={href}
                style={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  paddingTop: 8,
                  paddingBottom: 8,
                  gap: 3,
                  textDecoration: 'none',
                  color: active ? 'var(--primary)' : '#9E9E9E',
                }}
              >
                {/* Flutter-style pill behind icon+label when active */}
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 3,
                  padding: active ? '5px 16px' : '5px 10px',
                  borderRadius: 14,
                  background: active ? 'var(--primary-shade1)' : 'transparent',
                  transition: 'all 0.16s ease',
                }}>
                  <Icon size={22} strokeWidth={active ? 2.5 : 1.8} />
                  <span style={{ fontSize: 10.5, fontWeight: active ? 600 : 400, lineHeight: 1 }}>
                    {label}
                  </span>
                </div>
              </Link>
            );
          })}
          {/* Profile tab */}
          {(() => {
            const active = pathname === '/profile';
            return (
              <Link
                href="/profile"
                style={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  paddingTop: 8,
                  paddingBottom: 8,
                  gap: 3,
                  textDecoration: 'none',
                  color: active ? 'var(--primary)' : '#9E9E9E',
                }}
              >
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 3,
                  padding: active ? '5px 16px' : '5px 10px',
                  borderRadius: 14,
                  background: active ? 'var(--primary-shade1)' : 'transparent',
                  transition: 'all 0.16s ease',
                }}>
                  {user?.profilePhoto ? (
                    <img
                      src={user.profilePhoto}
                      alt=""
                      style={{
                        width: 22, height: 22,
                        borderRadius: '50%',
                        objectFit: 'cover',
                        border: active ? '2px solid var(--primary)' : '1.5px solid #D5D8DB',
                      }}
                    />
                  ) : (
                    <User size={22} strokeWidth={active ? 2.5 : 1.8} />
                  )}
                  <span style={{ fontSize: 10.5, fontWeight: active ? 600 : 400, lineHeight: 1 }}>
                    Profile
                  </span>
                </div>
              </Link>
            );
          })()}
        </div>
      </div>

    </>
  );
}
