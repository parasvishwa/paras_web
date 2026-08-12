'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { marketApi, ordersApi } from '@/lib/api';
import toast from 'react-hot-toast';
import { getStoredUser } from '@/lib/auth';
import { Package, ShoppingBag, IndianRupee, Clock, TrendingUp, AlertTriangle, Plus, ArrowRight } from 'lucide-react';

interface OrderItem {
  id: string;
  status: string;
  price: string;
  quantity: number;
  product?: { name: string; imageUrl?: string };
}

interface Order {
  id: string;
  createdAt: string;
  items: OrderItem[];
}

export default function SellerDashboardPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [productCount, setProductCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const user = getStoredUser();

  useEffect(() => {
    Promise.all([
      ordersApi.getVendorOrders(1),
      marketApi.getMyProducts(1, 1),
    ])
      .then(([ordRes, prodRes]) => {
        const ordData = ordRes.data?.data ?? ordRes.data ?? {};
        const orderList = ordData?.orders ?? (Array.isArray(ordData) ? ordData : []);
        setOrders(orderList);
        const prodData = prodRes.data?.data ?? prodRes.data ?? {};
        const total = prodData?.total ?? (Array.isArray(prodData) ? prodData.length : 0);
        setProductCount(typeof total === 'number' ? total : 0);
      })
      .catch(() => { toast.error('Failed to load dashboard data.'); })
      .finally(() => setLoading(false));
  }, []);

  const allItems: OrderItem[] = orders.flatMap((o) => (o.items ?? []).map((it) => ({ ...it, _orderId: o.id })));
  const pending = allItems.filter((it) => it.status === 'Pending').length;
  const inProgress = allItems.filter((it) => it.status === 'In Progress').length;
  const revenue = allItems
    .filter((it) => it.status.toLowerCase() === 'completed')
    .reduce((sum, it) => sum + (parseFloat(it.price) || 0) * (it.quantity || 1), 0);

  const recentOrders = orders.slice(0, 5);

  if (loading) return <DashboardSkeleton />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text)', letterSpacing: '-0.3px' }}>
            Welcome back{user?.fullname ? `, ${user.fullname.split(' ')[0]}` : ''}
          </h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>Here&apos;s how your store is doing</p>
        </div>
        <Link href="/products/new" className="btn-primary hidden sm:inline-flex">
          <Plus size={16} /> Add Product
        </Link>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={<ShoppingBag size={20} />} label="Total Orders" value={orders.length} color="var(--primary)" />
        <StatCard icon={<Clock size={20} />} label="Pending" value={pending + inProgress} color="var(--warning)" />
        <StatCard icon={<IndianRupee size={20} />} label="Revenue" value={`₹${revenue.toLocaleString('en-IN')}`} color="#15803D" />
        <StatCard icon={<Package size={20} />} label="Products" value={productCount} color="var(--brown)" />
      </div>

      {/* Alerts */}
      {pending > 0 && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl" style={{ background: '#FEF3C7', border: '1px solid #FDE68A' }}>
          <AlertTriangle size={18} style={{ color: '#B45309', flexShrink: 0 }} />
          <p className="text-sm font-semibold" style={{ color: '#92400E' }}>
            You have {pending} pending order{pending !== 1 ? 's' : ''} waiting for confirmation.
          </p>
          <Link href="/seller/orders" className="ml-auto text-sm font-bold whitespace-nowrap" style={{ color: '#B45309' }}>
            View <ArrowRight size={13} className="inline" />
          </Link>
        </div>
      )}

      {/* Recent orders */}
      <div className="card overflow-hidden">
        <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: '1px solid var(--border)' }}>
          <div className="flex items-center gap-2">
            <div className="section-accent" />
            <h2 className="font-bold text-base" style={{ color: 'var(--text)' }}>Recent Orders</h2>
          </div>
          <Link href="/seller/orders" className="text-sm font-semibold" style={{ color: 'var(--primary)' }}>
            View all <ArrowRight size={13} className="inline" />
          </Link>
        </div>

        {recentOrders.length === 0 ? (
          <div className="py-12 text-center">
            <ShoppingBag size={32} className="mx-auto mb-3" style={{ color: 'var(--text-muted)', opacity: 0.4 }} />
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No orders yet</p>
          </div>
        ) : (
          <div className="divide-y" style={{ borderColor: 'var(--border)' }}>
            {recentOrders.map((order) => {
              const firstItem = order.items?.[0];
              const itemCount = order.items?.length ?? 0;
              const orderRevenue = (order.items ?? []).reduce((s, it) => s + (parseFloat(it.price) || 0) * (it.quantity || 1), 0);
              const statuses = [...new Set((order.items ?? []).map((it) => it.status))];
              return (
                <div key={order.id} className="px-5 py-4 flex items-center gap-4">
                  {/* Product thumbnail */}
                  <div className="w-10 h-10 rounded-xl overflow-hidden flex-shrink-0 relative" style={{ background: 'var(--canvas)' }}>
                    {firstItem?.product?.imageUrl ? (
                      <Image src={firstItem.product.imageUrl} alt="" fill style={{ objectFit: 'cover' }} />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Package size={16} style={{ color: 'var(--text-muted)' }} />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate" style={{ color: 'var(--text)' }}>
                      {firstItem?.product?.name ?? 'Order'}
                      {itemCount > 1 ? <span className="font-normal" style={{ color: 'var(--text-muted)' }}> +{itemCount - 1} more</span> : null}
                    </p>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                      {new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="font-bold text-sm" style={{ color: 'var(--text)' }}>₹{orderRevenue.toLocaleString('en-IN')}</p>
                    <StatusBadge status={statuses[0] ?? ''} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <QuickLink href="/seller/products" icon={<Package size={20} />} title="Manage Products" desc="Edit, delete or add new listings" />
        <QuickLink href="/seller/orders" icon={<TrendingUp size={20} />} title="All Orders" desc="Update statuses and track sales" />
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: number | string; color: string }) {
  return (
    <div className="card p-4 flex flex-col gap-3">
      <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: color + '18', color }}>
        {icon}
      </div>
      <div>
        <p className="text-2xl font-bold" style={{ color: 'var(--text)', letterSpacing: '-0.5px' }}>{value}</p>
        <p className="text-xs font-semibold uppercase tracking-wide mt-0.5" style={{ color: 'var(--text-muted)' }}>{label}</p>
      </div>
    </div>
  );
}

function QuickLink({ href, icon, title, desc }: { href: string; icon: React.ReactNode; title: string; desc: string }) {
  return (
    <Link href={href} className="card card-hover p-4 flex items-center gap-4" data-hoverable>
      <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'var(--primary-light)', color: 'var(--primary)' }}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm" style={{ color: 'var(--text)' }}>{title}</p>
        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{desc}</p>
      </div>
      <ArrowRight size={16} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
    </Link>
  );
}

function StatusBadge({ status }: { status: string }) {
  const lower = status.toLowerCase();
  let cls = 'badge-warning';
  if (lower === 'completed') cls = 'badge-success';
  else if (lower === 'cancelled' || lower.includes('reject')) cls = 'badge-danger';
  else if (lower === 'in progress') cls = 'badge-primary';
  else if (lower.includes('return')) cls = 'badge-danger';
  return <span className={`badge ${cls} mt-0.5`}>{status || '—'}</span>;
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="h-8 skeleton w-48" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => <div key={i} className="skeleton h-28 rounded-2xl" />)}
      </div>
      <div className="skeleton h-48 rounded-2xl" />
    </div>
  );
}
