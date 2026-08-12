'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter, useSearchParams, usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  MapPin, Star, Share2, ArrowLeft, Phone,
  Package, MessageCircle, Globe, Shield,
  Briefcase, Tag, Award, Home, ShoppingBag, Image as ImageIcon,
} from 'lucide-react';
import QRCode from 'react-qr-code';
import toast from 'react-hot-toast';
import { exploreApi, marketApi, apiV1, apiV2, reviewsApi } from '@/lib/api';
import { isLoggedIn } from '@/lib/auth';

interface CowCensus {
  nandi?: number;
  milkingCows?: number;
  nonMilking?: number;
  maleCalves?: number;
  femaleCalves?: number;
  total?: number;
}

interface SocialLinks {
  phone?: string;
  whatsapp?: string;
  website?: string;
  facebook?: string;
  instagram?: string;
  youtube?: string;
  twitter?: string;
}

interface ProfileDetail {
  id: string;
  role?: string;
  fullname: string;
  businessName?: string;
  profilePhoto?: string;
  coverPhoto?: string;
  state?: string;
  district?: string;
  city?: string;
  badge?: string;
  avgRating?: number;
  reviewCount?: number;
  isVerified?: boolean;
  followers_count?: number;
  following_count?: number;
  description?: string;
  mobile?: string;
  email?: string;
  credibilityScore?: number;
  establishedYear?: number;
  // Gaushala / NGO fields
  capacity?: number;
  landAcres?: number;
  staff?: number;
  gauVanshCount?: number;
  gauVanshName?: string;
  acceptsGauDaan?: boolean;
  trustRegNo?: string;
  darpanNo?: string;
  legalStatus?: string;
  visitTiming?: string;
  hasTemple?: boolean;
  hasCCTV?: boolean;
  inHouseHospital?: boolean;
  provides80G?: boolean;
  has12A?: boolean;
  cowCensus?: CowCensus;
  facilities?: string[];
  certifications?: string[];
  // Vendor fields
  designation?: string;
  address?: string;
  website?: string;
  moq?: number;
  deliveryOptions?: string;
  returnPolicy?: string;
  paymentTermsText?: string;
  primaryCategories?: string[];
  productsAndServices?: string[];
  gstin?: string;
  pan?: string;
  fssai?: string;
  drugLicense?: string;
  tradeLicense?: string;
  msme?: string;
  // Payment (shared)
  upiId?: string;
  upiMerchantName?: string;
  upiQrCode?: string;
  bankName?: string;
  accountHolderName?: string;
  accountNo?: string;
  ifsc?: string;
  // Social (shared)
  socialLinks?: SocialLinks;
  phone?: string;
  whatsapp?: string;
  facebook?: string;
  instagram?: string;
  youtube?: string;
  twitter?: string;
}

interface Product {
  id: string;
  name: string;
  price: number;
  discountPrice?: number;
  images: string[];
  unit?: string;
}

interface Review {
  id: string;
  rating: number;
  review?: string;
  text?: string;
  images?: string[];
  createdAt: string;
  User?: { fullname?: string; profilePhoto?: string };
  user?: { fullname?: string; profilePhoto?: string };
}

interface Post {
  id: string;
  userId?: string;
  content?: string;
  text?: string;
  mediaUrls?: string[];
  images?: string[];
  imageUrl?: string;
  createdAt: string;
  type?: string;
}

const BADGE_STYLES: Record<string, { bg: string; color: string }> = {
  Diamond: { bg: '#EDE9FE', color: '#6D28D9' },
  Platinum: { bg: '#E8F4FD', color: '#1E6EAB' },
  Gold: { bg: '#FEF3C7', color: '#B45309' },
  Silver: { bg: '#F3F4F6', color: '#4B5563' },
};

const ROLE_BADGE_STYLE: Record<string, { bg: string; color: string }> = {
  Vendor:   { bg: '#FFF7ED', color: '#C2410C' },
  Expert:   { bg: '#EFF6FF', color: '#1D4ED8' },
  NGO:      { bg: '#F0FDF4', color: '#15803D' },
  Gaushala: { bg: '#FFF7ED', color: '#B45309' },
};

function StarRating({ rating, size = 14 }: { rating: number; size?: number }) {
  const full = Math.floor(rating);
  const half = rating - full >= 0.5;
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 2 }}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          size={size}
          fill={i <= full ? '#F59E0B' : i === full + 1 && half ? '#F59E0B' : 'none'}
          color={i <= full || (i === full + 1 && half) ? '#F59E0B' : '#D1D5DB'}
        />
      ))}
    </span>
  );
}

function SectionCard({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div className="card" style={{ padding: '18px 20px', marginBottom: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
        <div style={{ width: 34, height: 34, borderRadius: 10, background: 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)', flexShrink: 0 }}>
          {icon}
        </div>
        <span style={{ fontWeight: 700, fontSize: 15, color: 'var(--text)', letterSpacing: '-0.2px' }}>{title}</span>
      </div>
      {children}
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value?: string | number | null }) {
  if (!value && value !== 0) return null;
  return (
    <div style={{ display: 'flex', gap: 8, padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
      <span style={{ fontSize: 12, color: 'var(--text-muted)', minWidth: 110, flexShrink: 0 }}>{label}</span>
      <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>{value}</span>
    </div>
  );
}

function timeAgo(date: string): string {
  if (!date) return '';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';
  const diff = Math.floor((Date.now() - d.getTime()) / 1000);
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 2592000) return `${Math.floor(diff / 86400)}d ago`;
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function CowIcon(_props?: { size?: number }) {
  return <span style={{ fontSize: 16, lineHeight: 1 }}>🐄</span>;
}

const BACKEND = process.env.NEXT_PUBLIC_API_URL ?? 'https://app.gaubook.org';
function resolveImg(url?: string | null): string | undefined {
  if (!url) return undefined;
  if (url.startsWith('http')) return url;
  if (url.startsWith('/')) return `${BACKEND}${url}`;
  return url;
}

function resolveCover(raw: unknown): string | undefined {
  if (Array.isArray(raw)) return (raw as string[]).map((u) => resolveImg(u)).find((u) => !!u);
  return resolveImg(raw as string);
}

export default function ProfileDetailClientPage() {
  const params = useParams();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const rawId = params.id as string;
  // Support slug URLs like "gaushala-name-city-<uuid>" — extract the trailing UUID
  const UUID_RE = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  const uuidMatch = rawId.match(UUID_RE);
  const id = uuidMatch ? uuidMatch[0] : rawId;

  const [profile, setProfile] = useState<ProfileDetail | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [productsLoading, setProductsLoading] = useState(false);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState(() => {
    const t = searchParams.get('tab');
    return t ? t.charAt(0).toUpperCase() + t.slice(1) : 'About';
  });
  const [posts, setPosts] = useState<Post[]>([]);
  const [postsLoading, setPostsLoading] = useState(false);
  const [following, setFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [avatarError, setAvatarError] = useState(false);
  const [coverError, setCoverError] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareQrType, setShareQrType] = useState<'profile' | 'store'>('profile');
  const [shareLang, setShareLang] = useState<'en' | 'hi'>('en');

  const switchTab = useCallback((tab: string) => {
    setActiveTab(tab);
    const params = new URLSearchParams(searchParams.toString());
    params.set('tab', tab.toLowerCase());
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }, [pathname, router, searchParams]);

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        const res = await exploreApi.getGaushalaById(id);
        const raw = res.data;
        const base = raw?.data || raw;

        // Normalize role: API returns array e.g. ["Vendor"] or string
        const roleRaw = base?.role;
        const role: string = Array.isArray(roleRaw) ? (roleRaw[0] ?? 'Gaushala') : (roleRaw ?? 'Gaushala');

        // Normalize top-level coverPhoto (may be array) and prefix relative image URLs
        let merged: ProfileDetail = {
          ...base,
          role,
          profilePhoto: resolveImg(base.profilePhoto),
          coverPhoto: resolveCover(base.coverPhoto),
          followers_count: typeof base.followers_count === 'string' ? parseInt(base.followers_count) : base.followers_count,
          following_count: typeof base.following_count === 'string' ? parseInt(base.following_count) : base.following_count,
          reviewCount: typeof base.reviewCount === 'string' ? parseInt(base.reviewCount) : base.reviewCount,
        };

        if (role === 'Vendor' && base.vendorProfile) {
          const vp = base.vendorProfile;
          const cv = Array.isArray(vp.coverPhoto) ? vp.coverPhoto[0] : vp.coverPhoto;
          merged = {
            ...merged,
            businessName: vp.businessName ?? merged.businessName,
            profilePhoto: resolveImg(vp.profilePhoto) ?? merged.profilePhoto,
            coverPhoto: resolveImg(cv) ?? merged.coverPhoto,
            state: vp.state ?? merged.state,
            district: vp.district ?? merged.district,
            city: vp.city ?? merged.city,
            isVerified: vp.status === 'Verified',
            description: vp.businessDescription ?? merged.description,
            establishedYear: vp.yearOfEstablishment ?? merged.establishedYear,
            designation: vp.designation ?? merged.designation,
            address: vp.address ?? merged.address,
            website: vp.website ?? merged.website,
            moq: vp.minimumOrderQuantity ?? merged.moq,
            deliveryOptions: vp.deliveryOptions ?? merged.deliveryOptions,
            returnPolicy: vp.returnRefundPolicy ?? merged.returnPolicy,
            paymentTermsText: vp.paymentTerms ?? merged.paymentTermsText,
            primaryCategories: Array.isArray(vp.primaryVendorCategory)
              ? vp.primaryVendorCategory.filter((c: string, i: number, arr: string[]) => arr.indexOf(c) === i && !c.includes(','))
              : merged.primaryCategories,
            gstin: vp.gstNumber ?? merged.gstin,
            pan: vp.panNumber ?? merged.pan,
            fssai: vp.fssaiLicenseNumber ?? merged.fssai,
            drugLicense: vp.drugLicenseNumber ?? merged.drugLicense,
            tradeLicense: vp.tradeLicenseNumber ?? merged.tradeLicense,
            msme: vp.msmeRegistrationNumber ?? merged.msme,
            upiId: vp.upiId ?? merged.upiId,
            upiMerchantName: vp.upiMerchantName ?? merged.upiMerchantName,
            bankName: vp.bankName ?? merged.bankName,
            accountHolderName: vp.accountHolderName ?? merged.accountHolderName,
            accountNo: vp.accountNumber ?? merged.accountNo,
            ifsc: vp.ifsc ?? merged.ifsc,
            whatsapp: vp.whatsapp1 ?? vp.whatsapp ?? merged.whatsapp,
            facebook: vp.facebookUrl ?? merged.facebook,
            instagram: vp.instagramUrl ?? merged.instagram,
            youtube: vp.youtubeUrl ?? merged.youtube,
            twitter: vp.twitterUrl ?? merged.twitter,
          };
        } else if ((role === 'Gaushala' || role === 'NGO') && base.gaushala) {
          const g = base.gaushala;
          // Build cowCensus from individual count fields
          const cowCensus: CowCensus = {
            nandi: g.countNandi,
            milkingCows: g.countMilkingCow,
            nonMilking: g.countNonMilkingCow,
            maleCalves: g.countMaleCalf,
            femaleCalves: g.countFemaleCalf,
            total: g.totalCowCapacity ?? (
              (g.countNandi ?? 0) + (g.countMilkingCow ?? 0) + (g.countNonMilkingCow ?? 0) +
              (g.countMaleCalf ?? 0) + (g.countFemaleCalf ?? 0) || undefined
            ),
          };
          const hasCow = Object.values(cowCensus).some((v) => v != null && v > 0);
          // Build facilities & certifications from boolean flags
          const facilities: string[] = [];
          if (g.hasTemple) facilities.push('Temple');
          if (g.hasCCTV) facilities.push('CCTV');
          if (g.inHouseHospitalSetup) facilities.push('In-house Hospital');
          if (g.visitTiming) facilities.push(`Open: ${g.visitTiming}`);
          const certifications: string[] = [];
          if (g.provides80G) certifications.push('80G Certified');
          if (g.has12A) certifications.push('12A Certified');
          if (g.darpanNumber) certifications.push(`Darpan: ${g.darpanNumber}`);
          merged = {
            ...merged,
            businessName: g.gaushalaName ?? g.businessName ?? merged.businessName,
            profilePhoto: resolveImg(g.profilePhoto) ?? merged.profilePhoto,
            coverPhoto: resolveCover(g.coverPhoto) ?? merged.coverPhoto,
            state: g.state ?? merged.state,
            district: g.district ?? merged.district,
            city: g.villageTown ?? g.city ?? merged.city,
            isVerified: g.status === 'Verified' || merged.isVerified,
            badge: g.badge ?? merged.badge,
            credibilityScore: g.credibilityScore ?? merged.credibilityScore,
            description: g.bioDescription ?? g.description ?? merged.description,
            establishedYear: g.yearOfEstablishment ?? merged.establishedYear,
            capacity: g.gaushalaCapacity ?? g.capacity ?? merged.capacity,
            landAcres: g.totalLandArea ?? g.landAcres ?? merged.landAcres,
            staff: g.permanentStaffCount ?? g.staff ?? merged.staff,
            gauVanshCount: g.totalCowCapacity ?? merged.gauVanshCount,
            acceptsGauDaan: g.provides80G ?? merged.acceptsGauDaan,
            trustRegNo: g.trustRegistrationNumber ?? g.trustRegNo ?? merged.trustRegNo,
            darpanNo: g.darpanNumber ?? merged.darpanNo,
            legalStatus: g.legalStatus ?? merged.legalStatus,
            pan: g.panNumber ?? merged.pan,
            visitTiming: g.visitTiming ?? merged.visitTiming,
            hasTemple: g.hasTemple ?? merged.hasTemple,
            hasCCTV: g.hasCCTV ?? merged.hasCCTV,
            inHouseHospital: g.inHouseHospitalSetup ?? merged.inHouseHospital,
            provides80G: g.provides80G ?? merged.provides80G,
            has12A: g.has12A ?? merged.has12A,
            cowCensus: hasCow ? cowCensus : (merged.cowCensus),
            facilities: facilities.length > 0 ? facilities : (g.facilities ?? merged.facilities ?? []),
            certifications: certifications.length > 0 ? certifications : (g.certifications ?? merged.certifications ?? []),
            upiId: g.upiId ?? merged.upiId,
            upiMerchantName: g.upiMerchantName ?? merged.upiMerchantName,
            upiQrCode: resolveImg(g.upiQrCodeUrl) ?? merged.upiQrCode,
            bankName: g.bankName ?? merged.bankName,
            accountHolderName: g.accountHolderName ?? merged.accountHolderName,
            accountNo: g.accountNumber ?? g.accountNo ?? merged.accountNo,
            ifsc: g.ifsc ?? merged.ifsc,
            whatsapp: g.whatsapp1 ?? g.whatsapp ?? merged.whatsapp,
            website: g.website ?? merged.website,
            facebook: g.facebookUrl ?? g.facebook ?? merged.facebook,
            instagram: g.instagramUrl ?? g.instagram ?? merged.instagram,
            youtube: g.youtubeUrl ?? g.youtube ?? merged.youtube,
            twitter: g.xTwitterUrl ?? g.twitter ?? merged.twitter,
          };
        }

        setProfile(merged);
        {
          // Use embedded products from profile response if available
          if (Array.isArray(base.products) && base.products.length > 0) {
            const normalized: Product[] = base.products.map((p: Record<string, unknown>) => ({
              id: p.id as string,
              name: p.name as string,
              price: parseFloat(p.price as string) || 0,
              discountPrice: p.discountPrice ? parseFloat(p.discountPrice as string) : undefined,
              images: p.imageUrl ? [p.imageUrl as string] : (Array.isArray(p.images) ? p.images as string[] : []),
              unit: p.unit as string | undefined,
            }));
            setProducts(normalized);
            setProductsLoading(false);
          }
        }
      } catch {
        toast.error('Could not load profile');
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  // SEO: update browser tab title once profile loads
  useEffect(() => {
    if (!profile) return;
    const name = profile.businessName || profile.fullname || 'Profile';
    const role = Array.isArray(profile.role) ? profile.role[0] : profile.role;
    const roleLabel = role === 'Gaushala' ? 'Gaushala' : role === 'Vendor' ? 'Vendor' : role || 'Profile';
    const city = profile.city || profile.state || '';
    const loc = city ? ` — ${city}` : '';
    document.title = `${name}${loc} | ${roleLabel} on Gaubook`;
  }, [profile]);

  // Load products for all entity types (fallback if not embedded in profile response)
  useEffect(() => {
    if (!profile || products.length > 0) return;
    setProductsLoading(true);
    marketApi.getProducts({ userId: id, limit: 20 })
      .then((res) => {
        const payload = res.data?.data ?? res.data ?? {};
        const list: Product[] = Array.isArray(payload) ? payload : (payload.data ?? []);
        setProducts(list);
      })
      .catch(() => setProducts([]))
      .finally(() => setProductsLoading(false));
  }, [id, profile]);

  // Load posts on tab switch
  useEffect(() => {
    if (!id || activeTab !== 'Posts') return;
    if (posts.length > 0) return;
    setPostsLoading(true);
    apiV2.get('/posts', { params: { userId: id, limit: 50 } })
      .then((res) => {
        const data = res.data?.data ?? res.data ?? [];
        const all: Post[] = Array.isArray(data) ? data : (Array.isArray(data.posts) ? data.posts : []);
        const list = all.filter((p) => p.userId === id);
        setPosts(list);
      })
      .catch(() => setPosts([]))
      .finally(() => setPostsLoading(false));
  }, [id, activeTab]);

  // Load reviews on tab switch
  useEffect(() => {
    if (!id || activeTab !== 'Reviews') return;
    setReviewsLoading(true);
    reviewsApi.getProfileReviews(id)
      .then((res) => {
        const raw = res.data;
        let list: Review[] = [];
        if (Array.isArray(raw)) list = raw;
        else if (Array.isArray(raw?.data)) list = raw.data;
        else if (Array.isArray(raw?.reviews)) list = raw.reviews;
        setReviews(list);
      })
      .catch(() => setReviews([]))
      .finally(() => setReviewsLoading(false));
  }, [id, activeTab]);

  async function handleFollow() {
    if (!isLoggedIn()) { toast.error('Please login to follow'); router.push('/login'); return; }
    setFollowLoading(true);
    try {
      await apiV1.post('/follow', { followingId: id });
      setFollowing(true);
      toast.success('Now following!');
    } catch {
      toast.error('Could not follow. Try again.');
    } finally {
      setFollowLoading(false);
    }
  }

  function handleShare() {
    if (!profile) return;
    setShareQrType('profile');
    setShowShareModal(true);
  }

  async function handleNativeShare(url: string) {
    const name = profile?.businessName || profile?.fullname || 'this profile';
    try {
      if (typeof navigator !== 'undefined' && navigator.share) {
        await navigator.share({ title: name, text: `Check out ${name} on Gaubook!`, url });
      } else {
        await navigator.clipboard.writeText(url);
        toast.success('Link copied!');
      }
    } catch {
      try {
        await navigator.clipboard.writeText(url);
        toast.success('Link copied!');
      } catch {
        toast.error('Could not share.');
      }
    }
  }

  async function handleCopyLink(url: string) {
    try {
      await navigator.clipboard.writeText(url);
      toast.success('Link copied!');
    } catch {
      toast.error('Could not copy link.');
    }
  }

  if (loading) {
    return (
      <div style={{ background: 'var(--canvas)', minHeight: '100vh' }}>
        <div className="skeleton" style={{ height: 220, width: '100%' }} />
        <div className="max-w-3xl mx-auto px-4 pt-6" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div className="skeleton" style={{ height: 32, width: 200, borderRadius: 8 }} />
          <div className="skeleton" style={{ height: 16, width: 140, borderRadius: 6 }} />
          <div className="skeleton" style={{ height: 16, width: 260, borderRadius: 6 }} />
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div style={{ background: 'var(--canvas)', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', gap: 12 }}>
        <p className="text-lg font-semibold" style={{ color: 'var(--text)' }}>Profile not found</p>
        <button onClick={() => router.back()} className="btn-outline">Go back</button>
      </div>
    );
  }

  const role = profile.role ?? 'Gaushala';
  const isVendor = role === 'Vendor';
  const isExpert = role === 'Expert';

  const name = profile.businessName || profile.fullname;
  const location = [profile.city, profile.district, profile.state].filter(Boolean).join(', ');
  const badgeStyle = profile.badge ? BADGE_STYLES[profile.badge] : null;
  const roleBadge = ROLE_BADGE_STYLE[role] ?? ROLE_BADGE_STYLE.Gaushala;

  const eyebrowLabel =
    isVendor ? 'Vendor Profile' :
    isExpert ? 'Expert Profile' :
    role === 'NGO' ? 'NGO Profile' :
    role === 'Influencer' ? 'Influencer Profile' :
    role === 'Volunteer' ? 'Volunteer Profile' :
    role === 'Gaushala' ? 'Gaushala Profile' :
    `${role} Profile`;

  const avatarRadius = isVendor || isExpert ? '50%' : 16;

  const tabs = ['About', 'Posts', 'Photos', 'Reviews'];

  // Merged social links
  const social: SocialLinks = {
    phone: profile.socialLinks?.phone || profile.phone || profile.mobile,
    whatsapp: profile.socialLinks?.whatsapp || profile.whatsapp,
    website: profile.socialLinks?.website || profile.website,
    facebook: profile.socialLinks?.facebook || profile.facebook,
    instagram: profile.socialLinks?.instagram || profile.instagram,
    youtube: profile.socialLinks?.youtube || profile.youtube,
    twitter: profile.socialLinks?.twitter || profile.twitter,
  };

  const hasSocial = Object.values(social).some(Boolean);
  const cowCensus = profile.cowCensus;
  const hasCowCensus = cowCensus && Object.values(cowCensus).some((v) => v != null && v > 0);
  const hasFacilities = (profile.facilities?.length ?? 0) > 0 || (profile.certifications?.length ?? 0) > 0;
  const hasLegal = profile.trustRegNo || profile.legalStatus || profile.pan || profile.darpanNo || profile.visitTiming;
  const hasPayment = profile.upiId || profile.bankName || profile.accountNo;
  const hasCompliance = profile.gstin || profile.pan || profile.fssai || profile.drugLicense || profile.tradeLicense || profile.msme;
  const hasBusinessInfo = profile.designation || profile.address || profile.website || profile.establishedYear || profile.moq || profile.deliveryOptions || profile.returnPolicy;
  const hasCategories = (profile.primaryCategories?.length ?? 0) > 0 || (profile.productsAndServices?.length ?? 0) > 0;
  const hasStats = profile.capacity || profile.landAcres || profile.staff !== undefined || profile.gauVanshCount !== undefined;

  return (
    <div style={{ background: 'var(--canvas)', minHeight: '100vh', paddingBottom: 80 }}>
      {/* Cover */}
      <div style={{ position: 'relative', height: 200, width: '100%', flexShrink: 0 }}>
        {profile.coverPhoto && !coverError ? (
          <>
            <img src={profile.coverPhoto} alt={name} onError={() => setCoverError(true)} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', position: 'absolute', inset: 0 }} />
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.45) 100%)', pointerEvents: 'none' }} />
          </>
        ) : (
          <div style={{ width: '100%', height: '100%', background: '#FDFAF6', position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <img src="/logo.png" alt="" style={{ height: 100, opacity: 0.15, objectFit: 'contain', pointerEvents: 'none' }} />
          </div>
        )}
        <button onClick={() => router.back()} style={{ position: 'absolute', top: 14, left: 14, width: 36, height: 36, borderRadius: '50%', background: (profile.coverPhoto && !coverError) ? 'rgba(0,0,0,0.38)' : 'rgba(0,0,0,0.08)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: (profile.coverPhoto && !coverError) ? 'white' : 'var(--text)' }}>
          <ArrowLeft size={18} />
        </button>
        <span className="eyebrow" style={{ position: 'absolute', top: 14, left: '50%', transform: 'translateX(-50%)', background: (profile.coverPhoto && !coverError) ? 'rgba(255,255,255,0.18)' : 'rgba(0,0,0,0.06)', color: (profile.coverPhoto && !coverError) ? 'white' : 'var(--text)', whiteSpace: 'nowrap' }}>
          {eyebrowLabel}
        </span>
      </div>

      <div className="max-w-3xl mx-auto px-4">
        {/* Avatar */}
        <div style={{ marginTop: -36, marginBottom: 14, position: 'relative', zIndex: 1 }}>
          <div style={{ width: 72, height: 72, borderRadius: avatarRadius, border: '3px solid white', overflow: 'hidden', background: 'var(--canvas)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 16px rgba(0,0,0,0.12)' }}>
            {profile.profilePhoto && !avatarError
              ? <img src={profile.profilePhoto} alt="" onError={() => setAvatarError(true)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : <img src="/logo.png" alt="" style={{ width: 46, height: 46, objectFit: 'contain', opacity: 0.35 }} />}
          </div>
        </div>

        {/* Name + actions */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', marginBottom: 10 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.4px', textTransform: 'capitalize' }}>
                {name.toLowerCase()}
              </h1>
              {profile.isVerified && (
                <span style={{ fontSize: 11, fontWeight: 700, color: '#15803D', background: '#F0FDF4', padding: '2px 8px', borderRadius: 100, border: '1px solid #BBF7D0' }}>Verified</span>
              )}
            </div>

            {/* Role badge + tier badge + rating + location */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: roleBadge.color, background: roleBadge.bg, padding: '3px 10px', borderRadius: 100 }}>{role}</span>
              {badgeStyle && (
                <span className="badge" style={{ background: badgeStyle.bg, color: badgeStyle.color, fontSize: 12 }}>{profile.badge}</span>
              )}
              {!!profile.avgRating && profile.avgRating > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <StarRating rating={profile.avgRating} size={12} />
                  <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{profile.avgRating.toFixed(1)}{profile.reviewCount ? ` (${profile.reviewCount})` : ''}</span>
                </div>
              )}
              {profile.establishedYear && (
                <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 500 }}>Est. {profile.establishedYear}</span>
              )}
            </div>

            {location && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, color: 'var(--text-muted)', marginTop: 6 }}>
                <MapPin size={13} /> {location}
              </div>
            )}

            {/* Gau Daan chip */}
            {profile.acceptsGauDaan && (
              <div style={{ marginTop: 8 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--primary)', background: 'var(--primary-light)', padding: '3px 10px', borderRadius: 100 }}>We accept Gau Daan</span>
              </div>
            )}

            {/* Followers/Following */}
            {(profile.followers_count !== undefined || profile.following_count !== undefined) && (
              <div style={{ display: 'flex', gap: 16, marginTop: 10 }}>
                {profile.followers_count !== undefined && (
                  <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                    <strong style={{ color: 'var(--text)', fontWeight: 700 }}>{profile.followers_count.toLocaleString()}</strong> Followers
                  </span>
                )}
                {profile.following_count !== undefined && (
                  <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                    <strong style={{ color: 'var(--text)', fontWeight: 700 }}>{profile.following_count.toLocaleString()}</strong> Following
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
            <button
              onClick={handleFollow}
              disabled={following || followLoading}
              className={following ? 'btn-outline' : 'btn-primary'}
              style={{ fontSize: 14, padding: '10px 20px' }}
            >
              {followLoading ? (
                <span style={{ display: 'inline-block', width: 16, height: 16, borderRadius: '50%', border: '2px solid currentColor', borderTopColor: 'transparent', animation: 'spin 0.7s linear infinite' }} />
              ) : following ? 'Following' : 'Follow'}
            </button>
            <button onClick={() => switchTab('Store')} className="btn-outline" style={{ fontSize: 14, padding: '10px 14px' }} title="Store">
              <ShoppingBag size={16} />
            </button>
            <button onClick={handleShare} className="btn-outline" style={{ fontSize: 14, padding: '10px 14px' }} title="Share">
              <Share2 size={16} />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', border: '1.5px solid var(--border)', borderRadius: 12, overflow: 'hidden', marginTop: 20, marginBottom: 20 }}>
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => switchTab(tab)}
              style={{
                flex: 1, padding: '10px 4px', fontSize: 14, fontWeight: 600, border: 'none', cursor: 'pointer', transition: 'all 0.15s',
                ...(activeTab === tab ? { background: 'var(--primary)', color: 'white' } : { background: 'var(--surface)', color: 'var(--text-muted)' }),
              }}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* ── Store tab (Vendor only) ── */}
        {activeTab === 'Store' && (
          <div>
            {productsLoading ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14 }}>
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="card">
                    <div className="skeleton" style={{ aspectRatio: '1', width: '100%' }} />
                    <div style={{ padding: '10px 12px 12px', display: 'flex', flexDirection: 'column', gap: 6 }}>
                      <div className="skeleton" style={{ height: 13, width: '70%', borderRadius: 4 }} />
                      <div className="skeleton" style={{ height: 13, width: '40%', borderRadius: 4 }} />
                    </div>
                  </div>
                ))}
              </div>
            ) : products.length === 0 ? (
              <div className="card" style={{ padding: '48px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', gap: 8 }}>
                <Package size={40} style={{ color: 'var(--border)' }} />
                <p style={{ fontWeight: 600, color: 'var(--text)' }}>No products listed yet</p>
                <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>No products available from this profile.</p>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14 }}>
                {products.map((p) => {
                  const hasDiscount = p.discountPrice != null && p.discountPrice < p.price;
                  const discountPct = hasDiscount ? Math.round(((p.price - p.discountPrice!) / p.price) * 100) : 0;
                  return (
                    <div key={p.id} className="card card-hover flex flex-col">
                      <Link href={`/market/${p.id}`} style={{ display: 'block', textDecoration: 'none' }}>
                        <div style={{ aspectRatio: '1', overflow: 'hidden', position: 'relative', background: 'var(--canvas)' }}>
                          {p.images?.[0] ? (
                            <img src={p.images[0]} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          ) : (
                            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <Package size={32} style={{ color: 'var(--border)' }} />
                            </div>
                          )}
                          {hasDiscount && discountPct > 0 && <span className="discount-badge">{discountPct}% OFF</span>}
                        </div>
                        <div style={{ padding: '10px 12px 4px' }}>
                          <p style={{ fontWeight: 700, fontSize: 13, color: 'var(--text)', lineHeight: 1.4 }} className="line-clamp-2">{p.name}</p>
                          <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginTop: 4 }}>
                            <span style={{ fontWeight: 800, fontSize: 15, color: 'var(--primary)' }}>&#8377;{hasDiscount ? p.discountPrice : p.price}</span>
                            {hasDiscount && <span style={{ fontSize: 12, textDecoration: 'line-through', color: 'var(--text-muted)' }}>&#8377;{p.price}</span>}
                            {p.unit && <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>/{p.unit}</span>}
                          </div>
                        </div>
                      </Link>
                      <div style={{ padding: '4px 12px 12px' }}>
                        <Link href={`/market/${p.id}`} className="btn-primary w-full" style={{ padding: '8px 12px', borderRadius: 100, fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}>
                          <MessageCircle size={12} /> Enquire
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ── About tab ── */}
        {activeTab === 'About' && (
          <div>
            {/* Description */}
            {profile.description && (
              <SectionCard icon={isVendor ? <Briefcase size={16} /> : <Home size={16} />} title={isVendor ? 'About Business' : 'About'}>
                <p className="text-sm" style={{ color: 'var(--text)', lineHeight: 1.75 }}>{profile.description}</p>
              </SectionCard>
            )}

            {/* Stats grid: Gaushala / NGO */}
            {!isVendor && !isExpert && hasStats && (
              <div className="card" style={{ padding: '16px 20px', marginBottom: 12 }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 0 }}>
                  {[
                    { label: 'Max Capacity', value: profile.capacity != null ? profile.capacity.toLocaleString() : '-' },
                    { label: 'Land (acres)', value: profile.landAcres != null ? profile.landAcres : '-' },
                    { label: 'Staff', value: profile.staff != null ? profile.staff : '-' },
                    { label: 'Gau Vansh', value: profile.gauVanshCount != null ? profile.gauVanshCount : '-' },
                  ].map((stat, i) => (
                    <div key={stat.label} style={{ textAlign: 'center', padding: '10px 8px', borderLeft: i > 0 ? '1px solid var(--border)' : 'none' }}>
                      <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--primary)', lineHeight: 1.2 }}>{stat.value}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 3, fontWeight: 500 }}>{stat.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Contact */}
            {(profile.mobile || profile.email || hasSocial) && (
              <SectionCard icon={<Phone size={16} />} title="Contact">
                <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', marginBottom: 4 }}>{name}</p>
                {profile.mobile && <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 4 }}>{profile.mobile}</p>}
                {profile.email && <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 12 }}>{profile.email}</p>}
                {/* Contact + social icon row */}
                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 12, alignItems: 'center' }}>
                  {profile.mobile && (
                    <a href={`tel:${profile.mobile}`} title="Call" style={{ width: 44, height: 44, borderRadius: '50%', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none', flexShrink: 0 }}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="white"><path d="M6.6 10.8c1.4 2.8 3.8 5.1 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1C10.6 21 3 13.4 3 4c0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.3.2 2.5.6 3.6.1.3 0 .7-.2 1L6.6 10.8z"/></svg>
                    </a>
                  )}
                  {profile.mobile && (
                    <a href={`https://wa.me/${profile.mobile.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" title="WhatsApp" style={{ width: 44, height: 44, borderRadius: '50%', background: '#25D366', display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none', flexShrink: 0 }}>
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="white"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.890-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                    </a>
                  )}
                  {profile.email && (
                    <a href={`mailto:${profile.email}`} title="Email" style={{ width: 44, height: 44, borderRadius: '50%', background: '#EA4335', display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none', flexShrink: 0 }}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="white"><path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/></svg>
                    </a>
                  )}
                  {social.website && (
                    <a href={social.website} target="_blank" rel="noopener noreferrer" title="Website" style={{ width: 44, height: 44, borderRadius: '50%', background: 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none', flexShrink: 0 }}>
                      <Globe size={18} color="var(--primary)" />
                    </a>
                  )}
                  {social.facebook && (
                    <a href={social.facebook} target="_blank" rel="noopener noreferrer" title="Facebook" style={{ width: 44, height: 44, borderRadius: '50%', background: '#1877F2', display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none', flexShrink: 0 }}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="white"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                    </a>
                  )}
                  {social.instagram && (
                    <a href={social.instagram} target="_blank" rel="noopener noreferrer" title="Instagram" style={{ width: 44, height: 44, borderRadius: '50%', background: 'radial-gradient(circle at 30% 107%, #fdf497 0%, #fdf497 5%, #fd5949 45%, #d6249f 60%, #285AEB 90%)', display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none', flexShrink: 0 }}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="white"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
                    </a>
                  )}
                  {social.youtube && (
                    <a href={social.youtube} target="_blank" rel="noopener noreferrer" title="YouTube" style={{ width: 44, height: 44, borderRadius: '50%', background: '#FF0000', display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none', flexShrink: 0 }}>
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="white"><path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
                    </a>
                  )}
                  {social.twitter && (
                    <a href={social.twitter} target="_blank" rel="noopener noreferrer" title="X (Twitter)" style={{ width: 44, height: 44, borderRadius: '50%', background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none', flexShrink: 0 }}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="white"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.748l7.73-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                    </a>
                  )}
                </div>
              </SectionCard>
            )}

            {/* Cow Census (Gaushala/NGO only) */}
            {!isVendor && !isExpert && hasCowCensus && (
              <SectionCard icon={<CowIcon size={16} />} title="Cow Census">
                {cowCensus!.total != null && (
                  <div style={{ marginBottom: 12 }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--primary)', background: 'var(--primary-light)', padding: '3px 12px', borderRadius: 100 }}>
                      {cowCensus!.total} total
                    </span>
                  </div>
                )}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
                  {[
                    { label: 'Nandi', value: cowCensus!.nandi },
                    { label: 'Milking Cows', value: cowCensus!.milkingCows },
                    { label: 'Non-Milking', value: cowCensus!.nonMilking },
                    { label: 'Male Calves', value: cowCensus!.maleCalves },
                    { label: 'Female Calves', value: cowCensus!.femaleCalves },
                  ].filter((r) => r.value != null).map((row) => (
                    <div key={row.label} style={{ background: 'var(--canvas)', borderRadius: 10, padding: '12px 14px' }}>
                      <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--text)' }}>{row.value}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 1 }}>{row.label}</div>
                    </div>
                  ))}
                </div>
              </SectionCard>
            )}

            {/* Facilities & Certifications (Gaushala/NGO only) */}
            {!isVendor && !isExpert && hasFacilities && (
              <SectionCard icon={<Award size={16} />} title="Facilities & Certifications">
                {(profile.facilities?.length ?? 0) > 0 && (
                  <div style={{ marginBottom: 14 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.06em', textTransform: 'uppercase', display: 'block', marginBottom: 8 }}>Facilities</span>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                      {profile.facilities!.map((f) => (
                        <span key={f} style={{ fontSize: 12, fontWeight: 600, color: 'var(--brown)', background: 'var(--primary-light)', borderRadius: 100, padding: '4px 12px', border: '1px solid var(--border)' }}>{f}</span>
                      ))}
                    </div>
                  </div>
                )}
                {(profile.certifications?.length ?? 0) > 0 && (
                  <div>
                    <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.06em', textTransform: 'uppercase', display: 'block', marginBottom: 8 }}>Certifications</span>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                      {profile.certifications!.map((c) => {
                        const isDarpan = c.startsWith('Darpan: ');
                        const darpanNo = isDarpan ? c.replace('Darpan: ', '') : '';
                        return isDarpan ? (
                          <a
                            key={c}
                            href={`https://ngodarpan.gov.in/index.php/search/?search_text=${encodeURIComponent(darpanNo)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ fontSize: 12, fontWeight: 600, color: 'var(--primary)', background: 'var(--primary-light)', borderRadius: 100, padding: '4px 12px', border: '1px solid var(--border)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                          >
                            {c} ↗
                          </a>
                        ) : (
                          <span key={c} style={{ fontSize: 12, fontWeight: 600, color: 'var(--brown)', background: 'var(--primary-light)', borderRadius: 100, padding: '4px 12px', border: '1px solid var(--border)' }}>{c}</span>
                        );
                      })}
                    </div>
                  </div>
                )}
              </SectionCard>
            )}

            {/* Business Information (Vendor only) */}
            {isVendor && hasBusinessInfo && (
              <SectionCard icon={<Briefcase size={16} />} title="Business Information">
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <InfoRow label="Name" value={profile.businessName || profile.fullname} />
                  <InfoRow label="Established" value={profile.establishedYear} />
                  <InfoRow label="Designation" value={profile.designation} />
                  <InfoRow label="Location" value={[profile.city, profile.district, profile.state].filter(Boolean).join(', ') || undefined} />
                  <InfoRow label="Address" value={profile.address} />
                  <InfoRow label="Website" value={profile.website} />
                  <InfoRow label="MOQ" value={profile.moq} />
                  <InfoRow label="Delivery" value={profile.deliveryOptions} />
                  <InfoRow label="Returns" value={profile.returnPolicy} />
                  <InfoRow label="Payment terms" value={profile.paymentTermsText} />
                </div>
              </SectionCard>
            )}

            {/* Categories & Offerings (Vendor only) */}
            {isVendor && hasCategories && (
              <SectionCard icon={<Tag size={16} />} title="Categories & Offerings">
                {(profile.primaryCategories?.length ?? 0) > 0 && (
                  <div style={{ marginBottom: 14 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.06em', textTransform: 'uppercase', display: 'block', marginBottom: 8 }}>Primary Categories</span>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                      {profile.primaryCategories!.map((c) => (
                        <span key={c} style={{ fontSize: 12, fontWeight: 600, color: 'var(--primary)', background: 'var(--primary-light)', borderRadius: 100, padding: '4px 12px' }}>{c}</span>
                      ))}
                    </div>
                  </div>
                )}
                {(profile.productsAndServices?.length ?? 0) > 0 && (
                  <div>
                    <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.06em', textTransform: 'uppercase', display: 'block', marginBottom: 8 }}>Products & Services</span>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                      {profile.productsAndServices!.map((s) => (
                        <span key={s} style={{ fontSize: 12, fontWeight: 600, color: 'var(--brown)', background: 'var(--primary-light)', borderRadius: 100, padding: '4px 12px' }}>{s}</span>
                      ))}
                    </div>
                  </div>
                )}
              </SectionCard>
            )}

            {/* Compliance & Documents (Vendor only) */}
            {isVendor && hasCompliance && (
              <SectionCard icon={<Shield size={16} />} title="Compliance & Documents">
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {profile.gstin && <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--brown)', background: 'var(--primary-light)', borderRadius: 100, padding: '5px 13px', border: '1px solid var(--border)' }}>GST: {profile.gstin}</span>}
                  {profile.pan && <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--brown)', background: 'var(--primary-light)', borderRadius: 100, padding: '5px 13px', border: '1px solid var(--border)' }}>PAN {profile.pan}</span>}
                  {profile.fssai && <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--brown)', background: 'var(--primary-light)', borderRadius: 100, padding: '5px 13px', border: '1px solid var(--border)' }}>FSSAI {profile.fssai}</span>}
                  {profile.drugLicense && <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--brown)', background: 'var(--primary-light)', borderRadius: 100, padding: '5px 13px', border: '1px solid var(--border)' }}>Drug License {profile.drugLicense}</span>}
                  {profile.tradeLicense && <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--brown)', background: 'var(--primary-light)', borderRadius: 100, padding: '5px 13px', border: '1px solid var(--border)' }}>Trade License {profile.tradeLicense}</span>}
                  {profile.msme && <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--brown)', background: 'var(--primary-light)', borderRadius: 100, padding: '5px 13px', border: '1px solid var(--border)' }}>MSME {profile.msme}</span>}
                </div>
              </SectionCard>
            )}

            {/* Legal Information (Gaushala/NGO only) */}
            {!isVendor && !isExpert && hasLegal && (
              <SectionCard icon={<Shield size={16} />} title="Legal Information">
                <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                  {[
                    { label: 'Legal Status', value: profile.legalStatus },
                    { label: 'Trust Reg. No.', value: profile.trustRegNo },
                    { label: 'Darpan No.', value: profile.darpanNo, isDarpan: true },
                    { label: 'PAN', value: profile.pan },
                    { label: 'Visit Timing', value: profile.visitTiming },
                  ].filter((r) => r.value).map((row, i, arr) => (
                    <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: i < arr.length - 1 ? '1px solid var(--border)' : 'none' }}>
                      <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{row.label}</span>
                      {row.isDarpan ? (
                        <a
                          href={`https://ngodarpan.gov.in/index.php/search/?search_text=${encodeURIComponent(row.value!)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ fontSize: 13, fontWeight: 700, color: 'var(--primary)', textDecoration: 'underline', textAlign: 'right', maxWidth: '60%' }}
                        >
                          {row.value} ↗
                        </a>
                      ) : (
                        <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', textAlign: 'right', maxWidth: '60%' }}>{row.value}</span>
                      )}
                    </div>
                  ))}
                </div>
              </SectionCard>
            )}

            {/* Payment Details (shared) */}
            {hasPayment && (
              <SectionCard icon={<Award size={16} />} title="Payment Details">
                {profile.upiId && (
                  <div style={{ marginBottom: 14 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.06em', textTransform: 'uppercase', display: 'block', marginBottom: 8 }}>UPI</span>
                    {/* QR Code — generate from upiId first; fall back to uploaded image */}
                    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}>
                      <div style={{ background: 'white', padding: 12, borderRadius: 12, border: '1px solid var(--border)', display: 'inline-block' }}>
                        <QRCode
                          value={`upi://pay?pa=${profile.upiId}&pn=${encodeURIComponent(profile.upiMerchantName || profile.businessName || profile.fullname || '')}&cu=INR`}
                          size={160}
                          level="M"
                        />
                      </div>
                    </div>
                    {/* UPI apps strip */}
                    <div style={{ textAlign: 'center', marginBottom: 14 }}>
                      <p style={{ fontSize: 11.5, color: 'var(--text-muted)', marginBottom: 10, lineHeight: 1.5 }}>
                        Scan with any UPI app to donate directly to this gaushala
                      </p>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, flexWrap: 'wrap' }}>
                        {[
                          { name: 'GPay',       src: '/upi/gpay.svg' },
                          { name: 'PhonePe',    src: '/upi/phonepe.svg' },
                          { name: 'Paytm',      src: '/upi/paytm.svg' },
                          { name: 'BHIM',       src: '/upi/bhim.svg' },
                          { name: 'Amazon Pay', src: '/upi/amazonpay.svg' },
                        ].map(app => (
                          <div key={app.name} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5 }}>
                            <img
                              src={app.src}
                              alt={app.name}
                              style={{ width: 44, height: 44, borderRadius: 12, boxShadow: '0 1px 6px rgba(0,0,0,0.10)' }}
                            />
                            <span style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 600, whiteSpace: 'nowrap' }}>{app.name}</span>
                          </div>
                        ))}
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5 }}>
                          <div style={{ width: 44, height: 44, borderRadius: 12, background: 'var(--canvas)', border: '1.5px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 1px 6px rgba(0,0,0,0.08)' }}>
                            <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-muted)', letterSpacing: 0.5 }}>UPI</span>
                          </div>
                          <span style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 600 }}>& more</span>
                        </div>
                      </div>
                    </div>

                    <div style={{ background: 'var(--canvas)', borderRadius: 10, padding: '12px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                      <div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>UPI ID</div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>{profile.upiId}</div>
                        {profile.upiMerchantName && <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{profile.upiMerchantName}</div>}
                      </div>
                      <button
                        onClick={() => { navigator.clipboard.writeText(profile.upiId!); toast.success('Copied!'); }}
                        style={{ fontSize: 12, fontWeight: 700, color: 'var(--primary)', background: 'var(--primary-light)', border: 'none', borderRadius: 8, padding: '5px 12px', cursor: 'pointer' }}
                      >
                        Copy
                      </button>
                    </div>
                  </div>
                )}
                {profile.bankName && (
                  <div>
                    <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.06em', textTransform: 'uppercase', display: 'block', marginBottom: 8 }}>Bank</span>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                      <InfoRow label="Bank" value={profile.bankName} />
                      <InfoRow label="Holder" value={profile.accountHolderName} />
                      <InfoRow label="Account" value={profile.accountNo} />
                      <InfoRow label="IFSC" value={profile.ifsc} />
                    </div>
                  </div>
                )}
                <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 12, lineHeight: 1.5 }}>
                  Gaubook displays payment details submitted by entities and does not verify them. Please verify before making any transaction.
                </p>
              </SectionCard>
            )}

            {/* Empty state */}
            {!profile.description && !hasStats && !hasCowCensus && !hasFacilities && !hasLegal && !hasPayment && !hasCompliance && !hasBusinessInfo && !hasCategories && !profile.mobile && !profile.email && !hasSocial && (
              <div className="card" style={{ padding: '48px 24px', textAlign: 'center' }}>
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No details available yet.</p>
              </div>
            )}
          </div>
        )}

        {/* ── Posts tab ── */}
        {activeTab === 'Posts' && (
          <div>
            {postsLoading ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {[1, 2].map((i) => (
                  <div key={i} className="card" style={{ padding: 16 }}>
                    <div className="skeleton" style={{ height: 180, borderRadius: 10, marginBottom: 10 }} />
                    <div className="skeleton" style={{ height: 14, width: '70%', borderRadius: 6 }} />
                  </div>
                ))}
              </div>
            ) : posts.length === 0 ? (
              <div className="card" style={{ padding: '48px 24px', textAlign: 'center' }}>
                <MessageCircle size={40} style={{ color: 'var(--border)', margin: '0 auto 10px' }} />
                <p style={{ fontWeight: 600, color: 'var(--text)', marginBottom: 6 }}>No posts yet</p>
                <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Posts by this profile will appear here.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {posts.map((p) => {
                  const imgs = p.mediaUrls ?? p.images ?? (p.imageUrl ? [p.imageUrl] : []);
                  const text = p.content ?? p.text ?? '';
                  return (
                    <div key={p.id} className="card" style={{ padding: '14px 16px' }}>
                      {imgs.length > 0 && (
                        <div style={{ borderRadius: 10, overflow: 'hidden', marginBottom: 10 }}>
                          <img src={imgs[0]} alt="" style={{ width: '100%', objectFit: 'cover', maxHeight: 300, display: 'block' }} />
                        </div>
                      )}
                      {text && <p style={{ fontSize: 14, color: 'var(--text)', lineHeight: 1.6 }}>{text}</p>}
                      <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 8 }}>{timeAgo(p.createdAt)}</p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ── Photos tab ── */}
        {activeTab === 'Photos' && (
          <div>
            {posts.filter((p) => (p.mediaUrls ?? p.images ?? []).length > 0).length === 0 ? (
              <div className="card" style={{ padding: '48px 24px', textAlign: 'center' }}>
                <ImageIcon size={40} style={{ color: 'var(--border)', margin: '0 auto 10px' }} />
                <p style={{ fontWeight: 600, color: 'var(--text)', marginBottom: 6 }}>No photos yet</p>
                <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Photos from this profile will appear here.</p>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 3 }}>
                {posts.flatMap((p) => (p.mediaUrls ?? p.images ?? [])).map((img, idx) => (
                  <div key={idx} style={{ aspectRatio: '1', overflow: 'hidden' }}>
                    <img src={img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Reviews tab ── */}
        {activeTab === 'Reviews' && (
          <div>
            {!!profile.avgRating && profile.avgRating > 0 && (
              <div className="card" style={{ padding: '20px 24px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 20 }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 48, fontWeight: 800, color: 'var(--primary)', lineHeight: 1 }}>{profile.avgRating.toFixed(1)}</div>
                  <StarRating rating={profile.avgRating} size={18} />
                  <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
                    {profile.reviewCount || 0} review{(profile.reviewCount || 0) !== 1 ? 's' : ''}
                  </p>
                </div>
                <div style={{ flex: 1 }}>
                  <button
                    onClick={() => { if (!isLoggedIn()) { toast.error('Please login to review'); router.push('/login'); } }}
                    className="btn-outline"
                    style={{ width: '100%', fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
                  >
                    Write a Review
                  </button>
                </div>
              </div>
            )}

            {reviewsLoading ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {[1, 2, 3].map((i) => (
                  <div key={i} className="card" style={{ padding: 16 }}>
                    <div style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
                      <div className="skeleton" style={{ width: 40, height: 40, borderRadius: '50%', flexShrink: 0 }} />
                      <div style={{ flex: 1 }}>
                        <div className="skeleton" style={{ height: 14, width: '40%', borderRadius: 6, marginBottom: 6 }} />
                        <div className="skeleton" style={{ height: 12, width: '25%', borderRadius: 6 }} />
                      </div>
                    </div>
                    <div className="skeleton" style={{ height: 12, width: '80%', borderRadius: 6 }} />
                  </div>
                ))}
              </div>
            ) : reviews.length === 0 ? (
              <div className="card" style={{ padding: '48px 24px', textAlign: 'center' }}>
                <p style={{ fontWeight: 600, color: 'var(--text)', marginBottom: 6 }}>No reviews yet</p>
                <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Be the first to share your experience!</p>
                {!profile.avgRating && (
                  <button
                    onClick={() => { if (!isLoggedIn()) { toast.error('Please login to review'); router.push('/login'); } }}
                    className="btn-outline"
                    style={{ marginTop: 14, fontSize: 13 }}
                  >
                    Write a Review
                  </button>
                )}
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {reviews.map((r) => {
                  const author = r.User ?? r.user;
                  const text = r.review ?? r.text ?? '';
                  return (
                    <div key={r.id} className="card" style={{ padding: '16px 18px' }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10, marginBottom: 8 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--primary-light)', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            {author?.profilePhoto
                              ? <img src={author.profilePhoto} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                              : <span style={{ fontSize: 14, fontWeight: 800, color: 'var(--primary)' }}>{(author?.fullname?.[0] ?? '?').toUpperCase()}</span>}
                          </div>
                          <div>
                            <p style={{ fontWeight: 700, fontSize: 14, color: 'var(--text)', textTransform: 'capitalize' }}>{(author?.fullname ?? 'Anonymous').toLowerCase()}</p>
                            <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>{timeAgo(r.createdAt)}</p>
                          </div>
                        </div>
                        <StarRating rating={r.rating} size={13} />
                      </div>
                      {text && <p style={{ fontSize: 14, color: 'var(--text)', lineHeight: 1.6 }}>{text}</p>}
                      {(r.images?.length ?? 0) > 0 && (
                        <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
                          {r.images!.map((img, idx) => (
                            <img key={idx} src={img} alt="" style={{ width: 72, height: 72, borderRadius: 8, objectFit: 'cover' }} />
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      {/* ── Share Modal ── */}
      {showShareModal && profile && (() => {
        const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://gaubook.org';
        const profileUrl = `${SITE_URL}/gaushala/${id}`;
        const storeUrl = `${SITE_URL}/gaushala/${id}?tab=store`;
        const qrUrl = shareQrType === 'store' ? storeUrl : profileUrl;
        const displayName = profile.businessName || profile.fullname || '';
        const hasStore = (products.length > 0);

        const labels = {
          en: {
            title: 'Share Profile',
            profile: 'Profile',
            store: 'Store',
            profileLink: 'Profile Link',
            storeLink: 'Store Link',
            copy: 'Copy Link',
            share: 'Share',
            scan: 'Scan QR to visit',
          },
          hi: {
            title: 'प्रोफ़ाइल शेयर करें',
            profile: 'प्रोफ़ाइल',
            store: 'स्टोर',
            profileLink: 'प्रोफ़ाइल लिंक',
            storeLink: 'स्टोर लिंक',
            copy: 'लिंक कॉपी करें',
            share: 'शेयर करें',
            scan: 'QR स्कैन करें',
          },
        }[shareLang];

        return (
          <div
            style={{ position: 'fixed', inset: 0, zIndex: 9000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}
            onClick={() => setShowShareModal(false)}
          >
            <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.45)' }} />
            <div
              style={{ position: 'relative', width: '100%', maxWidth: 420, background: 'var(--surface)', borderRadius: 20, padding: '24px 20px 28px', boxShadow: '0 8px 40px rgba(0,0,0,0.22)', zIndex: 1, maxHeight: '90vh', overflowY: 'auto' }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header row */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  {/* Gaubook logo */}
                  <img src="/logo.png" alt="Gaubook" style={{ width: 28, height: 28, objectFit: 'contain' }} />
                  <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)' }}>{labels.title}</span>
                </div>
                {/* Hindi / English toggle */}
                <div style={{ display: 'flex', borderRadius: 100, overflow: 'hidden', border: '1.5px solid var(--border)' }}>
                  {(['en', 'hi'] as const).map((lang) => (
                    <button
                      key={lang}
                      onClick={() => setShareLang(lang)}
                      style={{ padding: '4px 12px', fontSize: 12, fontWeight: 700, background: shareLang === lang ? 'var(--primary)' : 'transparent', color: shareLang === lang ? '#fff' : 'var(--text-muted)', border: 'none', cursor: 'pointer', transition: 'background 0.2s' }}
                    >
                      {lang === 'en' ? 'EN' : 'हि'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Profile/Store tab switcher */}
              <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
                {(['profile', ...(hasStore ? ['store'] : [])] as ('profile' | 'store')[]).map((type) => (
                  <button
                    key={type}
                    onClick={() => setShareQrType(type)}
                    style={{ flex: 1, padding: '9px 0', borderRadius: 10, border: `1.5px solid ${shareQrType === type ? 'var(--primary)' : 'var(--border)'}`, background: shareQrType === type ? 'var(--primary-light)' : 'transparent', color: shareQrType === type ? 'var(--primary)' : 'var(--text-muted)', fontWeight: 700, fontSize: 14, cursor: 'pointer', transition: 'all 0.2s' }}
                  >
                    {type === 'profile' ? labels.profile : labels.store}
                  </button>
                ))}
              </div>

              {/* QR card */}
              <div style={{ background: '#fff', borderRadius: 16, padding: '20px 16px 16px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, marginBottom: 20, border: '1px solid var(--border)' }}>
                <img src="/logo.png" alt="Gaubook" style={{ width: 30, height: 30, objectFit: 'contain' }} />
                <QRCode value={qrUrl} size={140} bgColor="#ffffff" fgColor="#1a0a00" style={{ borderRadius: 8 }} />
                <p style={{ fontSize: 13, fontWeight: 700, color: '#1a0a00', textAlign: 'center', margin: 0 }}>{displayName}</p>
                <p style={{ fontSize: 11, color: '#7B4A1E', margin: 0 }}>{shareQrType === 'profile' ? labels.profileLink : labels.storeLink}</p>
                <p style={{ fontSize: 10, color: '#aaa', margin: 0 }}>{labels.scan}</p>
              </div>

              {/* Action buttons */}
              <div style={{ display: 'flex', gap: 10 }}>
                <button
                  onClick={() => handleCopyLink(qrUrl)}
                  style={{ flex: 1, padding: '12px 0', borderRadius: 12, border: '1.5px solid var(--border)', background: 'transparent', color: 'var(--text)', fontWeight: 700, fontSize: 14, cursor: 'pointer' }}
                >
                  {labels.copy}
                </button>
                <button
                  onClick={() => handleNativeShare(qrUrl)}
                  style={{ flex: 1, padding: '12px 0', borderRadius: 12, border: 'none', background: 'var(--primary)', color: '#fff', fontWeight: 700, fontSize: 14, cursor: 'pointer' }}
                >
                  {labels.share}
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
