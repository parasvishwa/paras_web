'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { isLoggedIn, getStoredUser } from '@/lib/auth';
import { LayoutDashboard, Package, ShoppingBag, Plus, ChevronRight } from 'lucide-react';

const NAV = [
  { href: '/seller/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/seller/products', icon: Package, label: 'My Products' },
  { href: '/seller/orders', icon: ShoppingBag, label: 'Orders' },
];

export default function SellerLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!isLoggedIn()) {
      router.replace('/login?next=' + encodeURIComponent(pathname));
      return;
    }
    const user = getStoredUser();
    const roles: string[] = Array.isArray(user?.role) ? user.role : [];
    if (!roles.includes('Vendor') && !roles.includes('Gaushala') && !roles.includes('NGO') && !roles.includes('Expert') && !roles.includes('Influencer')) {
      router.replace('/market');
      return;
    }
    setReady(true);
  }, [router, pathname]);

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--canvas)' }}>
        <div className="w-8 h-8 rounded-full border-3 border-t-transparent animate-spin" style={{ borderColor: 'var(--primary)', borderTopColor: 'transparent' }} />
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--canvas)' }}>
      {/* Top bar breadcrumb on mobile */}
      <div className="md:hidden px-4 py-3 flex gap-2 overflow-x-auto scrollbar-hide" style={{ borderBottom: '1px solid var(--border)', background: 'var(--surface)' }}>
        {NAV.map(({ href, icon: Icon, label }) => {
          const active = pathname === href;
          return (
            <Link key={href} href={href}
              className="filter-pill flex-shrink-0 flex items-center gap-1.5"
              style={active ? { background: 'var(--brand-gradient)', color: 'white', borderColor: 'transparent' } : {}}
            >
              <Icon size={14} /> {label}
            </Link>
          );
        })}
        <Link href="/products/new"
          className="filter-pill flex-shrink-0 flex items-center gap-1.5"
          style={{ background: 'var(--primary)', color: 'white', borderColor: 'transparent' }}
        >
          <Plus size={14} /> Add Product
        </Link>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6 md:py-8 flex gap-6">
        {/* Sidebar — desktop only */}
        <aside className="hidden md:flex flex-col gap-1 w-56 flex-shrink-0 self-start sticky top-24">
          <p className="label px-3 mb-1">Seller Hub</p>
          {NAV.map(({ href, icon: Icon, label }) => {
            const active = pathname === href;
            return (
              <Link key={href} href={href}
                className="flex items-center gap-3 px-4 py-3 rounded-xl font-semibold text-sm transition-all"
                style={active
                  ? { background: 'var(--primary-light)', color: 'var(--primary)', borderLeft: '3px solid var(--primary)' }
                  : { color: 'var(--text-secondary)' }}
              >
                <Icon size={18} style={{ flexShrink: 0 }} />
                {label}
                {active && <ChevronRight size={14} className="ml-auto" />}
              </Link>
            );
          })}
          <hr className="warm-divider my-2" />
          <Link href="/products/new"
            className="btn-primary flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold"
            style={{ borderRadius: 12 }}
          >
            <Plus size={16} /> Add Product
          </Link>
        </aside>

        {/* Main content */}
        <main className="flex-1 min-w-0">
          {children}
        </main>
      </div>
    </div>
  );
}
