'use client';

import { useState, useEffect, useCallback } from 'react';
import { ordersApi } from '@/lib/api';
import toast from 'react-hot-toast';
import { ShoppingBag, ChevronDown, Package, RefreshCw, Loader2 } from 'lucide-react';

const FILTER_CHIPS = ['All', 'Pending', 'In Progress', 'Completed', 'Cancelled', 'ReturnRequested'];

// Valid next states the vendor can set per current state
const VALID_TRANSITIONS: Record<string, string[]> = {
  'Pending':          ['In Progress', 'Cancelled'],
  'In Progress':      ['Completed', 'Cancelled'],
  'ReturnRequested':  ['ReturnApproved', 'ReturnRejected'],
};

interface OrderItem {
  id: string;
  status: string;
  price: string;
  quantity: number;
  product?: { id?: string; name?: string; imageUrl?: string };
}

interface Order {
  id: string;
  createdAt: string;
  totalAmount?: string;
  shippingAddress?: string;
  contactNumber?: string;
  user?: { fullname?: string; mobile?: string };
  items: OrderItem[];
}

export default function SellerOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('All');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [updatingItem, setUpdatingItem] = useState<string | null>(null);
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);

  const fetchOrders = useCallback(async (p = 1) => {
    setLoading(true);
    try {
      const res = await ordersApi.getVendorOrders(p);
      const data = res.data?.data ?? res.data ?? {};
      const list: Order[] = data?.orders ?? (Array.isArray(data) ? data : []);
      setOrders(list);
      setTotalPages(data?.totalPages ?? 1);
      setPage(p);
    } catch {
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchOrders(1); }, [fetchOrders]);

  const updateStatus = async (itemId: string, status: string, orderId: string) => {
    setUpdatingItem(itemId);
    try {
      await ordersApi.updateItemStatus(itemId, status);
      setOrders((prev) =>
        prev.map((o) =>
          o.id === orderId
            ? { ...o, items: o.items.map((it) => it.id === itemId ? { ...it, status } : it) }
            : o
        )
      );
      toast.success(`Status updated to ${status}`);
    } catch {
      toast.error('Failed to update status');
    } finally {
      setUpdatingItem(null);
    }
  };

  const filtered = filter === 'All'
    ? orders
    : orders.filter((o) => o.items.some((it) => it.status === filter));

  const pendingCount = orders.reduce((n, o) => n + o.items.filter((it) => it.status === 'Pending').length, 0);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text)', letterSpacing: '-0.3px' }}>Orders</h1>
          {pendingCount > 0 && (
            <p className="text-sm font-semibold mt-0.5" style={{ color: 'var(--warning)' }}>
              {pendingCount} pending — needs action
            </p>
          )}
        </div>
        <button onClick={() => fetchOrders(1)} className="btn-outline p-3" title="Refresh">
          <RefreshCw size={16} />
        </button>
      </div>

      {/* Filter chips */}
      <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
        {FILTER_CHIPS.map((chip) => (
          <button
            key={chip}
            onClick={() => setFilter(chip)}
            className={`filter-pill ${filter === chip ? 'active' : ''}`}
          >
            {chip}
            {chip === 'Pending' && pendingCount > 0 && (
              <span className="ml-1 px-1.5 py-0.5 rounded-full text-xs font-bold" style={{ background: 'rgba(255,255,255,0.3)' }}>
                {pendingCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Orders list */}
      {loading && orders.length === 0 ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => <div key={i} className="skeleton h-28 rounded-2xl" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="card py-16 flex flex-col items-center gap-3">
          <ShoppingBag size={40} style={{ color: 'var(--text-muted)', opacity: 0.35 }} />
          <p className="font-semibold" style={{ color: 'var(--text-muted)' }}>
            No orders {filter !== 'All' ? `with status "${filter}"` : 'yet'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((order) => {
            const isExpanded = expandedOrder === order.id;
            const orderTotal = parseFloat(order.totalAmount ?? '0') ||
              order.items.reduce((s, it) => s + (parseFloat(it.price) || 0) * (it.quantity || 1), 0);
            const buyerName = order.user?.fullname ?? order.user?.mobile ?? 'Customer';
            const date = new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

            return (
              <div key={order.id} className="card overflow-hidden">
                {/* Order header */}
                <button
                  onClick={() => setExpandedOrder(isExpanded ? null : order.id)}
                  className="w-full px-5 py-4 flex items-center gap-3 text-left transition-colors"
                  style={{ background: isExpanded ? 'var(--warm-tint)' : undefined }}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-sm" style={{ color: 'var(--text)' }}>
                        #{order.id.slice(0, 8).toUpperCase()}
                      </span>
                      <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{date}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>{buyerName}</span>
                      <span className="font-bold text-sm" style={{ color: 'var(--primary)' }}>
                        {'₹'}{orderTotal.toLocaleString('en-IN')}
                      </span>
                      <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                        {order.items.length} item{order.items.length !== 1 ? 's' : ''}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <ItemStatusSummary items={order.items} />
                    <ChevronDown
                      size={18}
                      style={{ color: 'var(--text-muted)', transform: isExpanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}
                    />
                  </div>
                </button>

                {/* Expanded items */}
                {isExpanded && (
                  <div style={{ borderTop: '1px solid var(--border)' }}>
                    {order.shippingAddress && (
                      <div className="px-5 py-3" style={{ background: 'var(--canvas)', borderBottom: '1px solid var(--border)' }}>
                        <p className="label mb-1">Ship to</p>
                        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{order.shippingAddress}</p>
                        {order.contactNumber && (
                          <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>📞 {order.contactNumber}</p>
                        )}
                      </div>
                    )}

                    {order.items.map((item) => {
                      const itemTotal = (parseFloat(item.price) || 0) * (item.quantity || 1);
                      const nextStates = VALID_TRANSITIONS[item.status] ?? [];
                      const canUpdate = nextStates.length > 0;

                      return (
                        <div key={item.id} className="px-5 py-4 flex items-start gap-3" style={{ borderBottom: '1px solid var(--border)' }}>
                          {/* Thumbnail */}
                          <div className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0" style={{ background: 'var(--canvas)' }}>
                            {item.product?.imageUrl ? (
                              <img src={item.product.imageUrl} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Package size={18} style={{ color: 'var(--text-muted)' }} />
                              </div>
                            )}
                          </div>

                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-sm" style={{ color: 'var(--text)' }}>
                              {item.product?.name ?? 'Product'}
                            </p>
                            <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                              Qty {item.quantity} × {'₹'}{parseFloat(item.price || '0').toLocaleString('en-IN')} = {'₹'}{itemTotal.toLocaleString('en-IN')}
                            </p>

                            {/* Status and update */}
                            <div className="flex items-center gap-2 mt-2 flex-wrap">
                              <StatusBadge status={item.status} />
                              {canUpdate && (
                                <div className="relative">
                                  <select
                                    defaultValue=""
                                    disabled={updatingItem === item.id}
                                    onChange={(e) => {
                                      if (e.target.value) updateStatus(item.id, e.target.value, order.id);
                                    }}
                                    className="input py-1 px-2 pr-8 text-xs font-semibold h-auto appearance-none cursor-pointer"
                                    style={{ minWidth: 140, borderColor: 'var(--primary)', color: 'var(--primary)' }}
                                  >
                                    <option value="" disabled>Move to…</option>
                                    {nextStates.map((s) => (
                                      <option key={s} value={s}>{s}</option>
                                    ))}
                                  </select>
                                  <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none">
                                    {updatingItem === item.id
                                      ? <Loader2 size={12} className="animate-spin" style={{ color: 'var(--primary)' }} />
                                      : <ChevronDown size={12} style={{ color: 'var(--primary)' }} />
                                    }
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2 pt-2">
          <button
            disabled={page <= 1 || loading}
            onClick={() => fetchOrders(page - 1)}
            className="btn-outline px-4 py-2 text-sm disabled:opacity-40"
          >
            Previous
          </button>
          <span className="flex items-center px-4 text-sm" style={{ color: 'var(--text-muted)' }}>
            {page} / {totalPages}
          </span>
          <button
            disabled={page >= totalPages || loading}
            onClick={() => fetchOrders(page + 1)}
            className="btn-outline px-4 py-2 text-sm disabled:opacity-40"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}

function ItemStatusSummary({ items }: { items: OrderItem[] }) {
  const counts: Record<string, number> = {};
  for (const it of items) counts[it.status] = (counts[it.status] ?? 0) + 1;
  const dominant = Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? '';
  return <StatusBadge status={dominant} />;
}

function StatusBadge({ status }: { status: string }) {
  const lower = status.toLowerCase();
  let cls = 'badge-warning';
  if (lower === 'completed') cls = 'badge-success';
  else if (lower === 'cancelled' || lower.includes('reject')) cls = 'badge-danger';
  else if (lower === 'in progress') cls = 'badge-primary';
  else if (lower.includes('return')) cls = 'badge-danger';
  return <span className={`badge ${cls}`}>{status || '—'}</span>;
}
