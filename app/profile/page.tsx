'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import {
  Camera, Edit2, MapPin, Package, FileText, ShoppingCart,
  LogOut, User, Save, X, Pin, PinOff, Heart, Share2, Eye,
} from 'lucide-react';
import { profileApi, feedApi, marketApi, ordersApi, authApi } from '@/lib/api';
import { isLoggedIn, getStoredUser, clearAuth, type GbUser } from '@/lib/auth';

// ─── Types ───────────────────────────────────────────────────────────────────

interface ProfileData {
  id: string;
  fullname: string;
  mobile?: string;
  email?: string;
  role: string | string[];
  requestedRole?: string;
  roleChangeStatus?: string;
  roleChangeRemarks?: string;
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
  pinnedPostId?: string | null;
}

interface Post {
  id: string;
  userId?: string;
  content?: string;
  mediaUrls?: string[];
  createdAt: string;
  likeCount?: number;
  likesCount?: number;
  isLiked?: boolean;
  shareCount?: number;
  viewCount?: number;
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

// ─── Available roles ──────────────────────────────────────────────────────────
const ALL_ROLES = ['Influencer', 'Vendor', 'Expert', 'Donor', 'Volunteer', 'Gaushala', 'NGO'] as const;

// ─── Photo crop modal ─────────────────────────────────────────────────────────
const CIRCLE = 300;

function PhotoCropModal({ file, onConfirm, onCancel }: {
  file: File;
  onConfirm: (f: File) => void;
  onCancel: () => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [tick, setTick] = useState(0);

  const off = useRef({ x: 0, y: 0 });
  const scaleRef = useRef(1);
  const dragging = useRef(false);
  const lastPos = useRef({ x: 0, y: 0 });
  const lastDist = useRef(0);
  const baseScale = useRef(1);

  const clamp = useCallback((x: number, y: number, s: number) => {
    if (!imgRef.current) return { x, y };
    const img = imgRef.current;
    const mx = Math.max(0, (img.naturalWidth * s - CIRCLE) / 2);
    const my = Math.max(0, (img.naturalHeight * s - CIRCLE) / 2);
    return { x: Math.min(mx, Math.max(-mx, x)), y: Math.min(my, Math.max(-my, y)) };
  }, []);

  const bump = () => setTick(n => n + 1);

  useEffect(() => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      imgRef.current = img;
      scaleRef.current = Math.max(CIRCLE / img.naturalWidth, CIRCLE / img.naturalHeight);
      off.current = { x: 0, y: 0 };
      setLoaded(true);
    };
    img.src = url;
    return () => URL.revokeObjectURL(url);
  }, [file]);

  useEffect(() => {
    if (!canvasRef.current || !imgRef.current || !loaded) return;
    const ctx = canvasRef.current.getContext('2d')!;
    const img = imgRef.current;
    const s = scaleRef.current;
    const { x, y } = off.current;
    const w = img.naturalWidth * s;
    const h = img.naturalHeight * s;
    ctx.clearRect(0, 0, CIRCLE, CIRCLE);
    ctx.drawImage(img, (CIRCLE - w) / 2 + x, (CIRCLE - h) / 2 + y, w, h);
  });

  const onMouseDown = (e: React.MouseEvent) => { dragging.current = true; lastPos.current = { x: e.clientX, y: e.clientY }; };
  const onMouseMove = (e: React.MouseEvent) => {
    if (!dragging.current) return;
    const dx = e.clientX - lastPos.current.x; const dy = e.clientY - lastPos.current.y;
    lastPos.current = { x: e.clientX, y: e.clientY };
    off.current = clamp(off.current.x + dx, off.current.y + dy, scaleRef.current);
    bump();
  };
  const onMouseUp = () => { dragging.current = false; };

  const onWheel = (e: React.WheelEvent) => {
    const ns = Math.max(0.5, Math.min(6, scaleRef.current * (e.deltaY < 0 ? 1.08 : 0.92)));
    scaleRef.current = ns;
    off.current = clamp(off.current.x, off.current.y, ns);
    bump();
  };

  const onTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) { lastPos.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }; lastDist.current = 0; baseScale.current = scaleRef.current; }
    else if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX; const dy = e.touches[0].clientY - e.touches[1].clientY;
      lastDist.current = Math.sqrt(dx * dx + dy * dy); baseScale.current = scaleRef.current;
    }
  };
  const onTouchMove = (e: React.TouchEvent) => {
    e.preventDefault();
    if (e.touches.length === 1) {
      const dx = e.touches[0].clientX - lastPos.current.x; const dy = e.touches[0].clientY - lastPos.current.y;
      lastPos.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      off.current = clamp(off.current.x + dx, off.current.y + dy, scaleRef.current); bump();
    } else if (e.touches.length === 2 && lastDist.current > 0) {
      const dx = e.touches[0].clientX - e.touches[1].clientX; const dy = e.touches[0].clientY - e.touches[1].clientY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      scaleRef.current = Math.max(0.5, Math.min(6, baseScale.current * (dist / lastDist.current)));
      off.current = clamp(off.current.x, off.current.y, scaleRef.current); bump();
    }
  };

  const setZoom = (v: number) => { scaleRef.current = v; off.current = clamp(off.current.x, off.current.y, v); bump(); };

  const handleConfirm = () => {
    if (!imgRef.current) return;
    const out = document.createElement('canvas');
    const SIZE = 480; out.width = SIZE; out.height = SIZE;
    const ctx = out.getContext('2d')!;
    const img = imgRef.current; const s = scaleRef.current; const { x, y } = off.current;
    const ratio = SIZE / CIRCLE;
    ctx.drawImage(img, ((CIRCLE - img.naturalWidth * s) / 2 + x) * ratio, ((CIRCLE - img.naturalHeight * s) / 2 + y) * ratio, img.naturalWidth * s * ratio, img.naturalHeight * s * ratio);
    out.toBlob(blob => { if (blob) onConfirm(new File([blob], 'avatar.jpg', { type: 'image/jpeg' })); }, 'image/jpeg', 0.92);
  };

  if (typeof document === 'undefined') return null;
  void tick;

  const zBtn: React.CSSProperties = { width: 30, height: 30, borderRadius: '50%', border: '1px solid rgba(255,255,255,0.35)', background: 'transparent', color: '#fff', fontSize: 18, cursor: 'pointer', lineHeight: 1, flexShrink: 0 };

  return createPortal(
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.93)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 22 }}>
      <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: 13, margin: 0 }}>Drag to reposition · Scroll or pinch to zoom</p>
      <canvas ref={canvasRef} width={CIRCLE} height={CIRCLE} style={{ display: 'block', borderRadius: '50%', border: '3px solid rgba(255,255,255,0.85)', cursor: loaded ? 'grab' : 'default', touchAction: 'none', background: '#111' }}
        onMouseDown={onMouseDown} onMouseMove={onMouseMove} onMouseUp={onMouseUp} onMouseLeave={onMouseUp}
        onWheel={onWheel} onTouchStart={onTouchStart} onTouchMove={onTouchMove}
        onTouchEnd={() => { dragging.current = false; lastDist.current = 0; }} />
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, width: CIRCLE }}>
        <button onClick={() => setZoom(Math.max(0.5, scaleRef.current * 0.88))} style={zBtn}>−</button>
        <input type="range" min={50} max={500} step={1} value={Math.round(scaleRef.current * 100)} onChange={e => setZoom(+e.target.value / 100)} style={{ flex: 1, accentColor: '#F07B1D' }} />
        <button onClick={() => setZoom(Math.min(6, scaleRef.current * 1.15))} style={zBtn}>+</button>
      </div>
      <div style={{ display: 'flex', gap: 12 }}>
        <button onClick={onCancel} style={{ padding: '10px 28px', borderRadius: 100, border: '1.5px solid rgba(255,255,255,0.3)', background: 'transparent', color: '#fff', fontSize: 14, cursor: 'pointer' }}>Cancel</button>
        <button onClick={handleConfirm} disabled={!loaded} style={{ padding: '10px 28px', borderRadius: 100, border: 'none', background: loaded ? '#F07B1D' : '#555', color: '#fff', fontSize: 14, fontWeight: 700, cursor: loaded ? 'pointer' : 'default' }}>Apply</button>
      </div>
    </div>,
    document.body
  );
}

function getRoles(profile: ProfileData): string[] {
  if (!profile?.role) return [];
  const arr = Array.isArray(profile.role) ? profile.role : [profile.role];
  return [...new Set(arr)];
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
    role: Array.isArray(_storedUser?.role) ? (_storedUser.role[0] ?? '') : (_storedUser?.role ?? ''),
  });
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [cropFile, setCropFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Tabs
  const [activeTab, setActiveTab] = useState<Tab>('posts');
  const [posts, setPosts] = useState<Post[]>([]);
  const [postsLoaded, setPostsLoaded] = useState(false);
  const [postsLoading, setPostsLoading] = useState(false);
  const [pinnedPostId, setPinnedPostId] = useState<string | null>(null);
  const [likedPosts, setLikedPosts] = useState<Record<string, boolean>>({});
  const [likeCounts, setLikeCounts] = useState<Record<string, number>>({});
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
        const userObj = body?.data?.user ?? {};
        const profileObj = body?.data?.profile ?? {};
        const data: ProfileData = Object.keys(userObj).length || Object.keys(profileObj).length
          ? { ...userObj, ...profileObj }
          : (body?.data ?? body?.user ?? body?.profile ?? body);
        setProfile(data);
        if (data.pinnedPostId) setPinnedPostId(data.pinnedPostId);
        setEditForm({
          fullname: data.fullname || '',
          email: data.email || '',
          bio: data.bio || '',
          businessName: data.businessName || '',
          state: data.state || '',
          district: data.district || '',
          role: Array.isArray(data.role) ? (data.role[0] ?? '') : (data.role ?? ''),
        });
      })
      .catch(() => toast.error('Failed to load profile'))
      .finally(() => setLoading(false));
  }, []);

  // ── Fetch tab data ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (activeTab === 'posts' && !postsLoaded) {
      setPostsLoading(true);
      const uid = profile?.id ?? getStoredUser()?.id;
      feedApi
        .getMyPosts(1, 20, uid)
        .then((res) => {
          const d = res.data?.data ?? res.data;
          const all: Post[] = Array.isArray(d) ? d : (d?.posts ?? []);
          // Backend doesn't filter by userId — filter client-side
          const mine = uid ? all.filter((p) => p.userId === uid) : all;
          setPosts(mine);
          const likedMap: Record<string, boolean> = {};
          const countMap: Record<string, number> = {};
          mine.forEach(p => {
            likedMap[p.id] = p.isLiked ?? false;
            countMap[p.id] = p.likeCount ?? p.likesCount ?? 0;
          });
          setLikedPosts(likedMap);
          setLikeCounts(countMap);
          setPostsLoaded(true);
        })
        .catch(() => toast.error('Failed to load posts'))
        .finally(() => setPostsLoading(false));
    }
  }, [activeTab, postsLoaded, profile]);

  useEffect(() => {
    if (activeTab === 'products' && !productsLoaded && profile) {
      setProductsLoading(true);
      marketApi
        .getProducts({ vendorId: getStoredUser()?.id })
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
    // reset input so same file can be re-picked
    e.target.value = '';
    setCropFile(file);
  };

  const handlePinPost = async (postId: string) => {
    const wasPinned = pinnedPostId === postId;
    setPinnedPostId(wasPinned ? null : postId);
    try {
      await feedApi.pinPost(postId);
      toast.success(wasPinned ? 'Post unpinned from profile' : 'Post pinned to your profile');
    } catch {
      setPinnedPostId(wasPinned ? postId : null);
      toast.error('Could not update pin');
    }
  };

  const handleLikePost = async (postId: string) => {
    const wasLiked = likedPosts[postId] ?? false;
    setLikedPosts(prev => ({ ...prev, [postId]: !wasLiked }));
    setLikeCounts(prev => ({ ...prev, [postId]: (prev[postId] ?? 0) + (wasLiked ? -1 : 1) }));
    try {
      await feedApi.likePost(postId);
    } catch {
      setLikedPosts(prev => ({ ...prev, [postId]: wasLiked }));
      setLikeCounts(prev => ({ ...prev, [postId]: (prev[postId] ?? 0) + (wasLiked ? 1 : -1) }));
    }
  };

  const handleSharePost = async (postId: string, content?: string) => {
    try {
      await feedApi.sharePost(postId);
      if (navigator.share) {
        await navigator.share({ title: 'Gaubook Post', text: content ?? '', url: window.location.href });
      } else {
        await navigator.clipboard.writeText(window.location.href);
        toast.success('Link copied!');
      }
    } catch {
      // share cancelled or failed silently
    }
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
        role: Array.isArray(profile.role) ? (profile.role[0] ?? '') : (profile.role ?? ''),
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

      // Submit role change request if role changed (admin must approve before it takes effect)
      const currentRole = Array.isArray(profile?.role) ? (profile.role[0] ?? '') : (profile?.role ?? '');
      let roleRequestSubmitted = false;
      if (editForm.role && editForm.role !== currentRole && profile?.roleChangeStatus !== 'Pending') {
        await authApi.updateRole(editForm.role);
        roleRequestSubmitted = true;
      }

      setProfile((prev) => ({
        ...prev!,
        ...updated,
        // Don't change actual role — it only changes after admin approves
        role: prev?.role ?? '',
        ...(roleRequestSubmitted ? { requestedRole: editForm.role, roleChangeStatus: 'Pending', roleChangeRemarks: undefined } : {}),
      }));

      // Sync localStorage (role stays unchanged until admin approves)
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

      if (roleRequestSubmitted) {
        toast.success(`Role change to ${editForm.role} submitted — awaiting admin approval`);
      } else {
        toast.success('Profile saved!');
      }
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
  const isGaushala = roles.includes('Gaushala');
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
      <div className="relative">
        {/* Banner — overflow-hidden clips dot pattern only, not the avatar */}
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
        </div>

        {/* Profile photo — outside banner so overflow-hidden doesn't clip it */}
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 z-10">
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
      <div className="mt-20 text-center px-2">
        <h1 className="text-xl font-bold text-[var(--text)] capitalize leading-tight break-words">
          {profile.businessName ?? profile.fullname}
        </h1>

        {profile.businessName && profile.businessName !== profile.fullname && (
          <p className="text-sm text-[var(--text-muted)] mt-0.5 capitalize">{profile.fullname}</p>
        )}

        {roles.length > 0 && (
          <div className="flex flex-wrap gap-2 justify-center mt-2">
            {roles.map((r) => (
              <span key={r} className="badge badge-primary">{r}</span>
            ))}
          </div>
        )}

        {profile.roleChangeStatus === 'Pending' && profile.requestedRole && (
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexWrap: 'wrap', gap: 6, marginTop: 8,
            padding: '4px 12px', borderRadius: 100, fontSize: 12, fontWeight: 600,
            background: 'rgba(240,123,29,0.10)', color: 'var(--primary)',
            border: '1.5px solid rgba(240,123,29,0.30)',
            maxWidth: '100%', wordBreak: 'break-word',
          }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--primary)', flexShrink: 0, display: 'inline-block' }} />
            Role change to {profile.requestedRole} pending approval
          </div>
        )}

        {profile.roleChangeStatus === 'Rejected' && profile.roleChangeRemarks && (
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexWrap: 'wrap', gap: 6, marginTop: 8,
            padding: '4px 12px', borderRadius: 100, fontSize: 12, fontWeight: 600,
            background: 'rgba(239,68,68,0.08)', color: '#ef4444',
            border: '1.5px solid rgba(239,68,68,0.25)',
            maxWidth: '100%', wordBreak: 'break-word',
          }}>
            Role change rejected: {profile.roleChangeRemarks}
          </div>
        )}

        {(profile.state || profile.district) && (
          <div className="flex items-center gap-1 justify-center mt-2 text-[var(--text-muted)] text-sm">
            <MapPin size={13} />
            <span>{[profile.district, profile.state].filter(Boolean).join(', ')}</span>
          </div>
        )}

        {profile.bio && !editMode && (
          <p className="mt-3 text-sm text-[var(--text-muted)] max-w-md mx-auto leading-relaxed break-words">
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
          <div className="flex flex-wrap gap-2 justify-center mt-4">
            <button
              onClick={handleSave}
              disabled={saving}
              className="btn-primary py-2 px-5 text-sm"
              style={{ minWidth: 130 }}
            >
              <Save size={14} /> {saving ? 'Saving…' : 'Save Changes'}
            </button>
            <button onClick={cancelEdit} className="btn-outline py-2 px-5 text-sm" style={{ minWidth: 100 }}>
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

          {/* Role selector */}
          <div>
            <label className="label">Role</label>
            {profile?.roleChangeStatus === 'Pending' ? (
              <div style={{
                marginTop: 8, padding: '10px 14px', borderRadius: 10, fontSize: 13,
                background: 'rgba(240,123,29,0.08)', border: '1.5px solid rgba(240,123,29,0.25)',
                color: 'var(--primary)', fontWeight: 500,
              }}>
                Role change to <strong>{profile.requestedRole}</strong> is pending admin approval. You cannot request another change until this is resolved.
              </div>
            ) : (
              <div className="flex flex-wrap gap-2 mt-1">
                {ALL_ROLES.map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setEditForm({ ...editForm, role: r })}
                    style={{
                      padding: '6px 14px',
                      borderRadius: 100,
                      fontSize: 13,
                      fontWeight: 600,
                      cursor: 'pointer',
                      border: editForm.role === r ? '2px solid var(--primary)' : '1.5px solid var(--border)',
                      background: editForm.role === r ? 'var(--primary-light)' : 'transparent',
                      color: editForm.role === r ? 'var(--primary)' : 'var(--text-muted)',
                      transition: 'all 0.15s',
                    }}
                  >
                    {r}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Stats row ──────────────────────────────────────────────────────────── */}
      <div className="card mt-6 p-4 grid grid-cols-3 divide-x divide-[var(--border)]">
        {[
          {
            label: 'Posts',
            value: postsLoaded ? posts.length : '—',
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
                {[...posts].sort((a, b) =>
                  a.id === pinnedPostId ? -1 : b.id === pinnedPostId ? 1 : 0
                ).map((post, i) => {
                  const isPinned = pinnedPostId === post.id;
                  return (
                    <div key={post.id ?? i} style={{ position: 'relative' }} className="card overflow-hidden hover:shadow-md transition-shadow">
                      {isPinned && (
                        <div style={{ position: 'absolute', top: 6, left: 6, zIndex: 2, display: 'flex', alignItems: 'center', gap: 3, background: 'rgba(240,123,29,0.9)', color: 'white', padding: '2px 7px', borderRadius: 6, fontSize: 10, fontWeight: 700 }}>
                          <Pin size={9} />
                          Pinned
                        </div>
                      )}
                      <button
                        onClick={() => handlePinPost(post.id)}
                        title={isPinned ? 'Unpin from profile' : 'Pin to top of profile'}
                        style={{ position: 'absolute', top: 6, right: 6, zIndex: 2, width: 28, height: 28, borderRadius: '50%', border: 'none', background: isPinned ? 'rgba(240,123,29,0.9)' : 'rgba(0,0,0,0.45)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                      >
                        {isPinned ? <PinOff size={13} /> : <Pin size={13} />}
                      </button>
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
                        {/* Like / Share / View row */}
                        <div className="flex items-center gap-3 mt-2 pt-2 border-t border-[var(--border)]">
                          <button
                            onClick={(e) => { e.stopPropagation(); handleLikePost(post.id); }}
                            className="flex items-center gap-1 text-[10px] font-semibold transition-colors"
                            style={{ color: likedPosts[post.id] ? '#ef4444' : 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                          >
                            <Heart size={12} fill={likedPosts[post.id] ? '#ef4444' : 'none'} />
                            {(likeCounts[post.id] ?? 0) > 0 && <span>{likeCounts[post.id]}</span>}
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleSharePost(post.id, post.content); }}
                            className="flex items-center gap-1 text-[10px] font-semibold text-[var(--text-muted)] transition-colors hover:text-[var(--primary)]"
                            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                          >
                            <Share2 size={12} />
                            {(post.shareCount ?? 0) > 0 && <span>{post.shareCount}</span>}
                          </button>
                          {(post.viewCount ?? 0) > 0 && (
                            <span className="flex items-center gap-1 text-[10px] text-[var(--text-muted)] ml-auto">
                              <Eye size={11} />{post.viewCount}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
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
                {products.map((product, i) => (
                  <div key={product.id ?? i} className="card overflow-hidden hover:shadow-md transition-shadow">
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
              orders.map((order, i) => (
                <div
                  key={order.id ?? i}
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

      {/* ── Gaushala registration CTA ──────────────────────────────────────────── */}
      {isGaushala && (
        <div className="mt-8 card p-4" style={{ border: '1.5px solid rgba(240,123,29,0.25)', background: 'rgba(240,123,29,0.04)' }}>
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-full flex-shrink-0 flex items-center justify-center" style={{ background: 'rgba(240,123,29,0.12)' }}>
              <FileText size={17} className="text-[var(--primary)]" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-[var(--text)]">Gaushala Registration</p>
              <p className="text-xs text-[var(--text-muted)] mt-0.5">Complete your gaushala profile and upload official documents (Darpan, 80G, registration forms)</p>
            </div>
          </div>
          <Link href="/gaushala/register" className="btn-primary mt-3 py-2.5 text-sm w-full justify-center block text-center">
            Register / Update Gaushala
          </Link>
        </div>
      )}

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

      {/* Photo crop modal — opens after image pick */}
      {cropFile && (
        <PhotoCropModal
          file={cropFile}
          onConfirm={(cropped) => {
            setCropFile(null);
            setPhotoFile(cropped);
            setPhotoPreview(URL.createObjectURL(cropped));
          }}
          onCancel={() => {
            setCropFile(null);
            if (fileInputRef.current) fileInputRef.current.value = '';
          }}
        />
      )}
    </div>
  );
}
