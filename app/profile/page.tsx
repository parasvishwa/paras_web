'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import {
  Camera, Edit2, MapPin, Package, FileText, ShoppingCart,
  LogOut, User, Save, X,
} from 'lucide-react';
import { profileApi, feedApi, marketApi, ordersApi } from '@/lib/api';
import { isLoggedIn, getStoredUser, clearAuth, type GbUser } from '@/lib/auth';

// ─── Types ───────────────────────────────────────────────────────────────────

interface ProfileData {
  id: string;
  fullname: string;
  mobile?: string;
  email?: string;
  role: string | string[];
  profilePhoto?: string;
  businessName?: string;
  state?: string;
  district?: string;
  bio?: string;
  Gaushalas?: unknown[];
  VendorProfiles?: { id: string }[];
  AppUserProfiles?: unknown[];
  followersCount?: number;
  followingCount?: number;
  postsCount?: number;
}

interface Post {
  id: string;
  content?: string;
  mediaUrls?: string[];
  createdAt: string;
  likesCount?: number;
  commentsCount?: number;
  category?: { name: string };
}

interface Product {
  id: string;
  name: string;
  price: number;
  images?: string[];
  stock?: number;
  status?: string;
}

interface OrderItem {
  name: string;
  quantity: number;
}

interface Order {
  id: string;
  status: string;
  totalAmount: number;
  createdAt: string;
  items?: OrderItem[];
}

type Tab = 'posts' | 'products' | 'orders';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getRoles(profile: ProfileData): string[] {
  if (!profile?.role) return [];
  return Array.isArray(profile.role) ? profile.role : [profile.role];
}

const ORDER_STATUS_CLASS: Record<string, string> = {
  pending: 'badge-warning',
  processing: 'badge-warning',
  shipped: 'badge-primary',
  delivered: 'badge-success',
  cancelled: 'badge-danger',
};

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ProfilePage() {
  const router = useRouter();

  // Profile
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);

  // Edit mode — pre-fill from localStorage immediately so fields aren't blank while API loads
  const [editMode, setEditMode] = useState(false);
  const _storedUser = getStoredUser();
  const [editForm, setEditForm] = useState({
    fullname: _storedUser?.fullname ?? '',
    email: _storedUser?.email ?? '',
    bio: '',
    businessName: _storedUser?.businessName ?? '',
    state: '',
    district: '',
  });
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Tabs
  const [activeTab, setActiveTab] = useState<Tab>('posts');
  const [posts, setPosts] = useState<Post[]>([]);
  const [postsLoaded, setPostsLoaded] = useState(false);
  const [postsLoading, setPostsLoading] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [productsLoaded, setProductsLoaded] = useState(false);
  const [productsLoading, setProductsLoading] = useState(false);
  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoaded, setOrdersLoaded] = useState(false);
  const [ordersLoading, setOrdersLoading] = useState(false);

  // ── Auth guard ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!isLoggedIn()) router.push('/login');
  }, [router]);

  // ── Fetch profile ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (!isLoggedIn()) return;
    profileApi
      .get()
      .then((res) => {
        // handle { data: { user: {...} } }, { data: {...} }, or bare object
        const body = res.data;
        const data: ProfileData =
          body?.data?.user ?? body?.data?.profile ?? body?.data ?? body?.user ?? body?.profile ?? body;
        setProfile(data);
        setEditForm({
          fullname: data.fullname || '',
          email: data.email || '',
          bio: data.bio || '',
          businessName: data.businessName || '',
          state: data.state || '',
          district: data.district || '',
        });
      })
      .catch(() => toast.error('Failed to load profile'))
      .finally(() => setLoading(false));
  }, []);

  // ── Fetch tab data ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (activeTab === 'posts' && !postsLoaded) {
      setPostsLoading(true);
      feedApi
        .getMyPosts(1)
        .then((res) => {
          const d = res.data?.data ?? res.data;
          setPosts(Array.isArray(d) ? d : (d?.posts ?? []));
          setPostsLoaded(true);
        })
        .catch(() => toast.error('Failed to load posts'))
        .finally(() => setPostsLoading(false));
    }
  }, [activeTab, postsLoaded]);

  useEffect(() => {
    if (activeTab === 'products' && !productsLoaded && profile) {
      setProductsLoading(true);
      marketApi
        .getProducts({ vendorId: profile.id })
        .then((res) => {
          const d = res.data?.data ?? res.data;
          setProducts(Array.isArray(d) ? d : (d?.products ?? []));
          setProductsLoaded(true);
        })
        .catch(() => toast.error('Failed to load products'))
        .finally(() => setProductsLoading(false));
    }
  }, [activeTab, productsLoaded, profile]);

  useEffect(() => {
    if (activeTab === 'orders' && !ordersLoaded) {
      setOrdersLoading(true);
      ordersApi
        .getMyOrders()
        .then((res) => {
          const d = res.data?.data ?? res.data;
          setOrders(Array.isArray(d) ? d : (d?.orders ?? []));
          setOrdersLoaded(true);
        })
        .catch(() => toast.error('Failed to load orders'))
        .finally(() => setOrdersLoading(false));
    }
  }, [activeTab, ordersLoaded]);

  // ── Handlers ────────────────────────────────────────────────────────────────
  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setPhotoPreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const cancelEdit = () => {
    setEditMode(false);
    setPhotoPreview(null);
    setPhotoFile(null);
    if (profile) {
      setEditForm({
        fullname: profile.fullname || '',
        email: profile.email || '',
        bio: profile.bio || '',
        businessName: profile.businessName || '',
        state: profile.state || '',
        district: profile.district || '',
      });
    }
  };

  const handleSave = async () => {
    if (!editForm.fullname.trim()) {
      toast.error('Name is required');
      return;
    }
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append('fullname', editForm.fullname.trim());
      if (editForm.email) fd.append('email', editForm.email.trim());
      if (editForm.bio) fd.append('bio', editForm.bio.trim());
      if (editForm.businessName) fd.append('businessName', editForm.businessName.trim());
      if (editForm.state) fd.append('state', editForm.state.trim());
      if (editForm.district) fd.append('district', editForm.district.trim());
      if (photoFile) fd.append('profilePhoto', photoFile);

      const res = await profileApi.update(fd);
      const updated: ProfileData = res.data?.data ?? res.data;

      setProfile((prev) => ({ ...prev!, ...updated }));

      // Sync localStorage
      const stored = getStoredUser();
      if (stored) {
        const next: GbUser = {
          ...stored,
          fullname: editForm.fullname.trim(),
          email: editForm.email.trim() || stored.email,
          businessName: editForm.businessName.trim() || stored.businessName,
          profilePhoto: updated.profilePhoto || stored.profilePhoto,
        };
        localStorage.setItem('gb_user', JSON.stringify(next));
      }

      toast.success('Profile saved!');
      setEditMode(false);
      setPhotoPreview(null);
      setPhotoFile(null);
    } catch {
      toast.error('Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    clearAuth();
    router.push('/login');
  };

  // ── Derived ─────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="skeleton h-48 w-full rounded-3xl mb-20" />
        <div className="text-center space-y-3">
          <div className="skeleton h-6 w-40 mx-auto rounded-lg" />
          <div className="skeleton h-4 w-24 mx-auto rounded-lg" />
        </div>
      </div>
    );
  }

  if (!profile) return null;

  const roles = getRoles(profile);
  const isVendor = roles.includes('Vendor');
  const hasBusinessProfile = roles.some((r) => ['Gaushala', 'Vendor', 'NGO'].includes(r));
  const photoSrc = photoPreview || profile.profilePhoto;

  const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
    { id: 'posts', label: 'My Posts', icon: FileText },
    ...(isVendor ? [{ id: 'products' as Tab, label: 'My Products', icon: Package }] : []),
    { id: 'orders', label: 'My Orders', icon: ShoppingCart },
  ];

  return (
    <div className="max-w-2xl mx-auto px-4 pb-16">
      {/* ── Cover ──────────────────────────────────────────────────────────── */}
      <div
        className="relative h-48 rounded-b-3xl overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #F07B1D 0%, #7B4A1E 100%)' }}
      >
        {/* subtle dot pattern */}
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage:
              'radial-gradient(circle, #fff 1px, transparent 1px)',
            backgroundSize: '32px 32px',
          }}
        />

        {/* Profile photo — centred, hanging off the bottom edge */}
        <div className="absolute -bottom-14 left-1/2 -translate-x-1/2 z-10">
          <div className="relative">
            <div className="w-28 h-28 rounded-full border-4 border-white shadow-lg overflow-hidden bg-[var(--primary-light)]">
              {photoSrc ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={photoSrc}
                  alt={profile.fullname}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <User size={40} className="text-[var(--primary)]" />
                </div>
              )}
            </div>

            {/* Camera button (edit mode) */}
            {editMode && (
              <button
                onClick={() => fileInputRef.current?.click()}
                className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-[var(--primary)] text-white flex items-center justify-center shadow-md hover:bg-[var(--primary-dark)] transition-colors"
                aria-label="Change photo"
              >
                <Camera size={14} />
              </button>
            )}
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handlePhotoChange}
          />
        </div>
      </div>

      {/* ── Identity block ───────────────────────────────────────────────────── */}
      <div className="mt-16 text-center">
        <h1 className="text-2xl font-bold text-[var(--text)] capitalize leading-tight">
          {profile.fullname}
        </h1>

        {roles.length > 0 && (
          <div className="flex flex-wrap gap-2 justify-center mt-2">
            {roles.map((r) => (
              <span key={r} className="badge badge-primary">{r}</span>
            ))}
          </div>
        )}

        {(profile.state || profile.district) && (
          <div className="flex items-center gap-1 justify-center mt-2 text-[var(--text-muted)] text-sm">
            <MapPin size={13} />
            <span>{[profile.district, profile.state].filter(Boolean).join(', ')}</span>
          </div>
        )}

        {profile.bio && !editMode && (
          <p className="mt-3 text-sm text-[var(--text-muted)] max-w-md mx-auto leading-relaxed">
            {profile.bio}
          </p>
        )}

        {/* Edit / Cancel-Save controls */}
        {!editMode ? (
          <button
            onClick={() => setEditMode(true)}
            className="btn-outline mt-4 py-2 px-5 text-sm"
          >
            <Edit2 size={14} /> Edit Profile
          </button>
        ) : (
          <div className="flex gap-2 justify-center mt-4">
            <button
              onClick={handleSave}
              disabled={saving}
              className="btn-primary py-2 px-5 text-sm"
            >
              <Save size={14} /> {saving ? 'Saving…' : 'Save Changes'}
            </button>
            <button onClick={cancelEdit} className="btn-outline py-2 px-5 text-sm">
              <X size={14} /> Cancel
            </button>
          </div>
        )}
      </div>

      {/* ── Edit form ──────────────────────────────────────────────────────────── */}
      {editMode && (
        <div className="card mt-6 p-5 space-y-4">
          <div>
            <label className="label">Full Name</label>
            <input
              className="input"
              value={editForm.fullname}
              onChange={(e) => setEditForm({ ...editForm, fullname: e.target.value })}
              placeholder="Your name"
            />
          </div>

          <div>
            <label className="label">Email</label>
            <input
              type="email"
              className="input"
              value={editForm.email}
              onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
              placeholder="your@email.com"
            />
          </div>

          <div>
            <label className="label">Bio</label>
            <textarea
              className="input resize-none"
              rows={3}
              value={editForm.bio}
              onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
              placeholder="Tell the Gaubook community about yourself…"
            />
          </div>

          {hasBusinessProfile && (
            <div>
              <label className="label">
                {roles.includes('Gaushala')
                  ? 'Gaushala Name'
                  : roles.includes('Vendor')
                  ? 'Business Name'
                  : 'Organization Name'}
              </label>
              <input
                className="input"
                value={editForm.businessName}
                onChange={(e) =>
                  setEditForm({ ...editForm, businessName: e.target.value })
                }
              />
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">State</label>
              <input
                className="input"
                value={editForm.state}
                onChange={(e) => setEditForm({ ...editForm, state: e.target.value })}
                placeholder="e.g. Rajasthan"
              />
            </div>
            <div>
              <label className="label">District</label>
              <input
                className="input"
                value={editForm.district}
                onChange={(e) =>
                  setEditForm({ ...editForm, district: e.target.value })
                }
                placeholder="e.g. Jaipur"
              />
            </div>
          </div>
        </div>
      )}

      {/* ── Stats row ──────────────────────────────────────────────────────────── */}
      <div className="card mt-6 p-4 grid grid-cols-3 divide-x divide-[var(--border)]">
        {[
          {
            label: 'Posts',
            value: profile.postsCount ?? (postsLoaded ? posts.length : '—'),
          },
          { label: 'Following', value: profile.followingCount ?? 0 },
          { label: 'Followers', value: profile.followersCount ?? 0 },
        ].map(({ label, value }) => (
          <div key={label} className="text-center px-2">
            <div className="text-xl font-bold text-[var(--text)]">{value}</div>
            <div className="text-xs text-[var(--text-muted)] mt-0.5">{label}</div>
          </div>
        ))}
      </div>

      {/* ── Tabs ───────────────────────────────────────────────────────────────── */}
      <div className="mt-6">
        <div className="flex border-b border-[var(--border)] overflow-x-auto scrollbar-hide">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`flex items-center gap-1.5 px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                activeTab === id
                  ? 'border-[var(--primary)] text-[var(--primary)]'
                  : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text)]'
              }`}
            >
              <Icon size={15} />
              {label}
            </button>
          ))}
        </div>

        {/* ── Posts ──────────────────────────────────────────────────────────── */}
        {activeTab === 'posts' && (
          <div className="mt-4">
            {postsLoading ? (
              <div className="grid grid-cols-2 gap-3">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="skeleton h-44 rounded-xl" />
                ))}
              </div>
            ) : posts.length === 0 ? (
              <div className="text-center py-14 text-[var(--text-muted)]">
                <FileText size={40} className="mx-auto mb-3 opacity-30" />
                <p className="font-medium">No posts yet</p>
                <p className="text-sm mt-1 opacity-70">Share your first update with the community</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {posts.map((post) => (
                  <div key={post.id} className="card overflow-hidden hover:shadow-md transition-shadow">
                    {post.mediaUrls?.[0] ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={post.mediaUrls[0]}
                        alt=""
                        className="w-full h-32 object-cover"
                      />
                    ) : (
                      <div className="w-full h-32 bg-[var(--primary-light)] flex items-center justify-center">
                        <FileText size={24} className="text-[var(--primary)] opacity-40" />
                      </div>
                    )}
                    <div className="p-3">
                      {post.category?.name && (
                        <span className="badge badge-primary text-[10px] mb-1.5">
                          {post.category.name}
                        </span>
                      )}
                      {post.content && (
                        <p className="text-xs text-[var(--text)] line-clamp-2 leading-relaxed">
                          {post.content}
                        </p>
                      )}
                      <p className="text-[10px] text-[var(--text-muted)] mt-1.5">
                        {new Date(post.createdAt).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                        })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Products ─────────────────────────────────────────────────────────── */}
        {activeTab === 'products' && isVendor && (
          <div className="mt-4">
            {productsLoading ? (
              <div className="grid grid-cols-2 gap-3">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="skeleton h-52 rounded-xl" />
                ))}
              </div>
            ) : products.length === 0 ? (
              <div className="text-center py-14 text-[var(--text-muted)]">
                <Package size={40} className="mx-auto mb-3 opacity-30" />
                <p className="font-medium">No products listed</p>
                <p className="text-sm mt-1 mb-4 opacity-70">Start selling gau products today</p>
                <Link href="/products/new" className="btn-primary py-2 px-5 text-sm">
                  <Package size={14} /> Add Product
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {products.map((product) => (
                  <div key={product.id} className="card overflow-hidden hover:shadow-md transition-shadow">
                    {product.images?.[0] ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={product.images[0]}
                        alt={product.name}
                        className="w-full h-32 object-cover"
                      />
                    ) : (
                      <div className="w-full h-32 bg-[var(--primary-light)] flex items-center justify-center">
                        <Package size={24} className="text-[var(--primary)] opacity-40" />
                      </div>
                    )}
                    <div className="p-3">
                      <p className="text-sm font-semibold text-[var(--text)] line-clamp-1">
                        {product.name}
                      </p>
                      <p className="text-sm font-bold text-[var(--primary)] mt-0.5">
                        ₹{product.price.toLocaleString('en-IN')}
                      </p>
                      <div className="flex items-center justify-between mt-2">
                        {product.status && (
                          <span
                            className={`badge text-[10px] ${
                              product.status === 'active'
                                ? 'badge-success'
                                : 'badge-warning'
                            }`}
                          >
                            {product.status}
                          </span>
                        )}
                        <Link
                          href={`/products/${product.id}/edit`}
                          className="text-xs text-[var(--primary)] font-semibold hover:underline ml-auto"
                        >
                          Edit →
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Orders ───────────────────────────────────────────────────────────── */}
        {activeTab === 'orders' && (
          <div className="mt-4 space-y-3">
            {ordersLoading ? (
              [...Array(3)].map((_, i) => (
                <div key={i} className="skeleton h-20 rounded-xl" />
              ))
            ) : orders.length === 0 ? (
              <div className="text-center py-14 text-[var(--text-muted)]">
                <ShoppingCart size={40} className="mx-auto mb-3 opacity-30" />
                <p className="font-medium">No orders yet</p>
                <p className="text-sm mt-1 opacity-70">Your purchases will appear here</p>
              </div>
            ) : (
              orders.map((order) => (
                <div
                  key={order.id}
                  className="card p-4 flex items-start gap-3 hover:shadow-sm transition-shadow"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-semibold text-[var(--text)]">
                        #{order.id.slice(-6).toUpperCase()}
                      </p>
                      <span
                        className={`badge text-[10px] ${
                          ORDER_STATUS_CLASS[order.status?.toLowerCase()] ?? 'badge-primary'
                        }`}
                      >
                        {order.status}
                      </span>
                    </div>

                    {order.items && order.items.length > 0 && (
                      <p className="text-xs text-[var(--text-muted)] mt-1 truncate">
                        {order.items
                          .map((item) =>
                            item.quantity > 1 ? `${item.name} ×${item.quantity}` : item.name
                          )
                          .join(', ')}
                      </p>
                    )}

                    <p className="text-[11px] text-[var(--text-muted)] mt-1">
                      {new Date(order.createdAt).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </p>
                  </div>

                  <div className="text-right shrink-0">
                    <p className="text-sm font-bold text-[var(--text)]">
                      ₹{order.totalAmount.toLocaleString('en-IN')}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* ── Logout ───────────────────────────────────────────────────────────────── */}
      <div className="mt-12 flex justify-center">
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 px-6 py-3 rounded-xl text-[var(--danger)] border-1.5 border-[var(--danger)] font-medium text-sm hover:bg-red-50 transition-colors"
          style={{ border: '1.5px solid var(--danger)' }}
        >
          <LogOut size={16} /> Sign Out
        </button>
      </div>
    </div>
  );
}
