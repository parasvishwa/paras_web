'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { marketApi } from '@/lib/api';
import { isLoggedIn, getStoredUser } from '@/lib/auth';
import {
  ChevronLeft, ChevronRight, MessageCircle, Share2,
  MapPin, Package, Store, Loader2, ExternalLink,
  X, Copy, Check,
} from 'lucide-react';
import toast from 'react-hot-toast';

const BACKEND = 'https://app.gaubook.org';
function resolveImg(url?: string | null): string {
  if (!url) return '';
  if (url.startsWith('http')) return url;
  if (url.startsWith('/')) return `${BACKEND}${url}`;
  return url;
}

interface ProductVariation {
  id: string;
  name?: string;
  value?: string;
  price?: number;
}

interface Product {
  id: string;
  userId?: string;
  name: string;
  description?: string;
  price: number;
  discountPrice?: number;
  imageUrl?: string;
  images?: string[];
  category?: string;
  subcategory?: string;
  unit?: string;
  stock?: number;
  user?: {
    id?: string;
    fullname?: string;
    businessName?: string;
    profilePhoto?: string;
    city?: string;
    state?: string;
    mobile?: string;
  };
  variations?: ProductVariation[];
}

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [mainIdx, setMainIdx] = useState(0);
  const [shareOpen, setShareOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const loggedIn = isLoggedIn();
  const currentUser = getStoredUser();

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    marketApi.getProductById(id)
      .then((res) => {
        const raw = res.data?.data ?? res.data;
        setProduct(raw);
      })
      .catch(() => setError('Product not found.'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <LoadingSkeleton />;
  if (error || !product) return (
    <div className="max-w-4xl mx-auto px-4 py-20 text-center">
      <Package size={52} className="mx-auto mb-4" style={{ color: 'var(--border)' }} />
      <p className="font-semibold text-lg" style={{ color: 'var(--text-muted)' }}>{error || 'Product not found'}</p>
      <Link href="/market" className="btn-outline mt-6 inline-flex text-sm py-2 px-5">
        <ChevronLeft size={16} /> Back to Market
      </Link>
    </div>
  );

  const images = [
    product.imageUrl,
    ...(Array.isArray(product.images) ? product.images : []),
  ].filter(Boolean).map((url) => resolveImg(url as string)).filter(Boolean) as string[];
  const hasImages = images.length > 0;
  const isVendor = loggedIn && currentUser?.id === product.userId;
  const vendorName = product.user?.businessName ?? product.user?.fullname ?? 'Vendor';
  const vendorLocation = [product.user?.city, product.user?.state].filter(Boolean).join(', ');
  const discounted = product.discountPrice != null && product.discountPrice < product.price;
  const displayPrice = discounted ? product.discountPrice! : product.price;
  const discount = discounted
    ? Math.round(((product.price - product.discountPrice!) / product.price) * 100)
    : 0;

  /* ── WhatsApp enquiry ── */
  const handleEnquire = () => {
    const phone = product.user?.mobile;
    if (!phone) {
      toast.error('No contact number available.');
      return;
    }
    const msg = encodeURIComponent(
      `Hi, I'm interested in "${product.name}" listed on Gaubook.\n\nPrice: ₹${displayPrice}${product.unit ? `/${product.unit}` : ''}\nLink: ${window.location.href}\n\nPlease share more details.`
    );
    window.open(`https://wa.me/${phone.replace(/\D/g, '')}?text=${msg}`, '_blank');
  };

  /* ── Share ── */
  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: product.name, url: window.location.href });
        return;
      } catch { /* cancelled */ }
    }
    setShareOpen(true);
  };

  const copyLink = async () => {
    await navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      {/* Back */}
      <Link href="/market" className="inline-flex items-center gap-1.5 text-sm font-medium mb-5" style={{ color: 'var(--text-muted)' }}>
        <ChevronLeft size={16} /> Back to Market
      </Link>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* ── Image Gallery ── */}
        <div>
          {/* Main image */}
          <div
            className="card rounded-2xl overflow-hidden relative"
            style={{ aspectRatio: '1 / 1', background: 'var(--canvas)' }}
          >
            {hasImages ? (
              <>
                <img
                  src={images[mainIdx]}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
                {images.length > 1 && (
                  <>
                    <button
                      onClick={() => setMainIdx((i) => (i - 1 + images.length) % images.length)}
                      className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/80 backdrop-blur flex items-center justify-center shadow"
                    >
                      <ChevronLeft size={16} />
                    </button>
                    <button
                      onClick={() => setMainIdx((i) => (i + 1) % images.length)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/80 backdrop-blur flex items-center justify-center shadow"
                    >
                      <ChevronRight size={16} />
                    </button>
                  </>
                )}
              </>
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Package size={64} style={{ color: 'var(--border)' }} />
              </div>
            )}
          </div>

          {/* Thumbnail strip */}
          {images.length > 1 && (
            <div className="flex gap-2 mt-3 overflow-x-auto scrollbar-hide pb-1">
              {images.map((src, i) => (
                <button
                  key={i}
                  onClick={() => setMainIdx(i)}
                  className="shrink-0 w-16 h-16 rounded-xl overflow-hidden border-2 transition-colors"
                  style={{
                    border: i === mainIdx ? '2px solid var(--primary)' : '2px solid var(--border)',
                  }}
                >
                  <img src={src} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ── Product Info ── */}
        <div className="flex flex-col gap-5">
          {/* Category badge */}
          {(product.category || product.subcategory) && (
            <div className="flex gap-2 flex-wrap">
              {product.category && (
                <span className="badge badge-primary">{product.category}</span>
              )}
              {product.subcategory && (
                <span className="badge" style={{ background: 'var(--canvas)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}>
                  {product.subcategory}
                </span>
              )}
            </div>
          )}

          {/* Name */}
          <h1 className="text-2xl font-bold leading-snug" style={{ color: 'var(--text)' }}>
            {product.name}
          </h1>

          {/* Price */}
          <div className="flex items-end gap-3 flex-wrap">
            <span className="text-3xl font-bold" style={{ color: 'var(--primary)' }}>
              ₹{displayPrice}
            </span>
            {discounted && (
              <span className="text-lg line-through" style={{ color: 'var(--text-muted)' }}>₹{product.price}</span>
            )}
            {product.unit && (
              <span className="text-sm pb-0.5" style={{ color: 'var(--text-muted)' }}>per {product.unit}</span>
            )}
            {discount > 0 && (
              <span className="badge badge-success">{discount}% OFF</span>
            )}
          </div>

          {/* Stock */}
          {product.stock != null && (
            <p className="text-sm font-medium" style={{ color: product.stock > 0 ? 'var(--success)' : 'var(--danger)' }}>
              {product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}
            </p>
          )}

          {/* Variations */}
          {product.variations && product.variations.length > 0 && (
            <div>
              <span className="label">Variants</span>
              <div className="flex gap-2 flex-wrap mt-1">
                {product.variations.map((v) => (
                  <span
                    key={v.id}
                    className="px-3 py-1.5 rounded-lg text-sm font-medium border"
                    style={{ border: '1.5px solid var(--border)', color: 'var(--text)' }}
                  >
                    {v.name ?? v.value}
                    {v.price != null && <span style={{ color: 'var(--text-muted)' }}> — ₹{v.price}</span>}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Vendor card */}
          {(() => {
            const vendorUserId = product.user?.id;
            const cardContent = (
              <>
                <div className="shrink-0">
                  {product.user?.profilePhoto ? (
                    <img
                      src={resolveImg(product.user.profilePhoto)}
                      alt={vendorName}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                  ) : (
                    <div
                      className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold"
                      style={{ background: 'var(--primary-light)', color: 'var(--primary)' }}
                    >
                      {vendorName[0]?.toUpperCase()}
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <Store size={14} style={{ color: 'var(--primary)' }} />
                    <p className="font-semibold text-sm truncate" style={{ color: 'var(--text)' }}>{vendorName}</p>
                  </div>
                  {vendorLocation && (
                    <p className="text-xs mt-0.5 flex items-center gap-1" style={{ color: 'var(--text-muted)' }}>
                      <MapPin size={11} /> {vendorLocation}
                    </p>
                  )}
                </div>
                {vendorUserId && <ExternalLink size={16} className="shrink-0 group-hover:opacity-100 opacity-40 transition-opacity" style={{ color: 'var(--primary)' }} />}
              </>
            );
            return vendorUserId ? (
              <Link href={`/gaushala/${vendorUserId}`} className="card p-4 flex items-center gap-3 hover:shadow-md transition-shadow group">
                {cardContent}
              </Link>
            ) : (
              <div className="card p-4 flex items-center gap-3">
                {cardContent}
              </div>
            );
          })()}

          {/* Actions */}
          <div className="flex gap-3 flex-wrap">
            <button onClick={handleEnquire} className="btn-primary flex-1 py-3">
              <MessageCircle size={18} /> Enquire on WhatsApp
            </button>
            <button onClick={handleShare} className="btn-outline py-3 px-4">
              <Share2 size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* ── Description ── */}
      {product.description && (
        <div className="card p-6 mt-8">
          <h2 className="font-bold text-lg mb-3" style={{ color: 'var(--text)' }}>About this product</h2>
          <p className="text-sm leading-relaxed whitespace-pre-line" style={{ color: 'var(--text-muted)' }}>
            {product.description}
          </p>
        </div>
      )}

      {/* ── Share modal ── */}
      {shareOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.4)' }}
          onClick={() => setShareOpen(false)}
        >
          <div
            className="card w-full max-w-sm p-5 rounded-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold" style={{ color: 'var(--text)' }}>Share product</h3>
              <button onClick={() => setShareOpen(false)} style={{ color: 'var(--text-muted)' }}>
                <X size={20} />
              </button>
            </div>
            <div
              className="flex items-center gap-2 p-3 rounded-xl text-sm mb-4 truncate"
              style={{ background: 'var(--canvas)', border: '1.5px solid var(--border)' }}
            >
              <span className="truncate flex-1" style={{ color: 'var(--text-muted)' }}>
                {typeof window !== 'undefined' ? window.location.href : ''}
              </span>
            </div>
            <div className="flex gap-3">
              <button
                onClick={copyLink}
                className="btn-primary flex-1 py-2.5 text-sm"
              >
                {copied ? <Check size={16} /> : <Copy size={16} />}
                {copied ? 'Copied!' : 'Copy link'}
              </button>
              <button
                onClick={handleEnquire}
                className="btn-outline flex-1 py-2.5 text-sm"
                style={{ borderColor: '#25D366', color: '#25D366' }}
              >
                <MessageCircle size={16} /> WhatsApp
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <div className="skeleton h-5 w-28 mb-5" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <div className="skeleton rounded-2xl" style={{ aspectRatio: '1 / 1' }} />
          <div className="flex gap-2 mt-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="skeleton w-16 h-16 rounded-xl" />
            ))}
          </div>
        </div>
        <div className="space-y-4">
          <div className="skeleton h-5 w-24" />
          <div className="skeleton h-8 w-4/5" />
          <div className="skeleton h-8 w-36" />
          <div className="skeleton h-20 rounded-2xl" />
          <div className="flex gap-3">
            <div className="skeleton h-12 flex-1 rounded-xl" />
            <div className="skeleton h-12 w-12 rounded-xl" />
          </div>
        </div>
      </div>
      <div className="skeleton h-40 rounded-2xl mt-8" />
    </div>
  );
}
