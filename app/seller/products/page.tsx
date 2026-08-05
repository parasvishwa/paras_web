'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { marketApi } from '@/lib/api';
import toast from 'react-hot-toast';
import { Plus, Pencil, Trash2, Package, Search, Loader2, RefreshCw } from 'lucide-react';

interface ProductVariation {
  id: string;
  qty: number;
  price?: string;
}

interface Product {
  id: string;
  name: string;
  price?: string;
  discountPrice?: string;
  unit?: string;
  category?: string;
  isActive?: boolean;
  imageUrl?: string;
  stock?: number;
  variations?: ProductVariation[];
}

interface Pagination {
  total: number;
  page: number;
  totalPages: number;
}

export default function SellerProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ total: 0, page: 1, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [deleting, setDeleting] = useState<string | null>(null);
  const [toggling, setToggling] = useState<string | null>(null);

  const fetchProducts = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const res = await marketApi.getMyProducts(page, 20);
      const data = res.data?.data ?? res.data ?? {};
      const list: Product[] = Array.isArray(data) ? data : (data?.products ?? []);
      const pag = { total: data?.total ?? list.length, page: data?.page ?? page, totalPages: data?.totalPages ?? 1 };
      setProducts(list);
      setPagination(pag);
    } catch {
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return products;
    return products.filter((p) => p.name.toLowerCase().includes(q) || p.category?.toLowerCase().includes(q));
  }, [products, search]);

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return;
    setDeleting(id);
    try {
      await marketApi.deleteProduct(id);
      toast.success('Product deleted');
      setProducts((prev) => prev.filter((p) => p.id !== id));
    } catch {
      toast.error('Failed to delete product');
    } finally {
      setDeleting(null);
    }
  };

  const handleToggleActive = async (product: Product) => {
    setToggling(product.id);
    try {
      const fd = new FormData();
      fd.append('isActive', String(!product.isActive));
      await marketApi.updateProduct(product.id, fd);
      setProducts((prev) => prev.map((p) => p.id === product.id ? { ...p, isActive: !p.isActive } : p));
      toast.success(product.isActive ? 'Product hidden from market' : 'Product listed on market');
    } catch {
      toast.error('Failed to update product');
    } finally {
      setToggling(null);
    }
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text)', letterSpacing: '-0.3px' }}>My Products</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>
            {filtered.length !== products.length
              ? `${filtered.length} of ${pagination.total}`
              : `${pagination.total}`} listing{pagination.total !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => fetchProducts(pagination.page)} className="btn-outline p-3" title="Refresh">
            <RefreshCw size={16} />
          </button>
          <Link href="/products/new" className="btn-primary">
            <Plus size={16} /> Add
          </Link>
        </div>
      </div>

      {/* Search (client-side filter) */}
      <div className="relative">
        <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
        <input
          className="input pl-10"
          placeholder="Filter your products…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Products grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => <div key={i} className="skeleton h-52 rounded-2xl" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="card py-16 flex flex-col items-center gap-3">
          <Package size={40} style={{ color: 'var(--text-muted)', opacity: 0.35 }} />
          <p className="font-semibold" style={{ color: 'var(--text-muted)' }}>
            {search ? 'No products match your search' : 'No products yet'}
          </p>
          {!search && (
            <Link href="/products/new" className="btn-primary mt-2"><Plus size={16} /> Add your first product</Link>
          )}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onDelete={() => handleDelete(product.id, product.name)}
                onToggle={() => handleToggleActive(product)}
                isDeleting={deleting === product.id}
                isToggling={toggling === product.id}
              />
            ))}
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex justify-center gap-2 pt-2">
              <button
                disabled={pagination.page <= 1}
                onClick={() => fetchProducts(pagination.page - 1)}
                className="btn-outline px-4 py-2 text-sm disabled:opacity-40"
              >
                Previous
              </button>
              <span className="flex items-center px-4 text-sm" style={{ color: 'var(--text-muted)' }}>
                {pagination.page} / {pagination.totalPages}
              </span>
              <button
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => fetchProducts(pagination.page + 1)}
                className="btn-outline px-4 py-2 text-sm disabled:opacity-40"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function ProductCard({
  product,
  onDelete,
  onToggle,
  isDeleting,
  isToggling,
}: {
  product: Product;
  onDelete: () => void;
  onToggle: () => void;
  isDeleting: boolean;
  isToggling: boolean;
}) {
  const img = product.imageUrl;
  const price = product.discountPrice && Number(product.discountPrice) > 0 ? product.discountPrice : product.price;
  const hasDiscount = product.discountPrice && Number(product.discountPrice) > 0 && Number(product.discountPrice) < Number(product.price);
  const hasVariations = product.variations && product.variations.length > 0;
  const totalStock = hasVariations
    ? product.variations!.reduce((s, v) => s + (v.qty ?? 0), 0)
    : product.stock !== undefined && product.stock !== null ? product.stock : null;
  const lowStock = totalStock !== null && totalStock > 0 && totalStock <= 5;
  const outOfStock = totalStock !== null && totalStock === 0;

  return (
    <div className="card overflow-hidden flex flex-col" style={{ opacity: product.isActive === false ? 0.65 : 1 }}>
      {/* Image */}
      <div className="relative" style={{ paddingTop: '62%', background: 'var(--canvas)' }}>
        {img ? (
          <img src={img} alt={product.name} className="absolute inset-0 w-full h-full object-cover" />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <Package size={28} style={{ color: 'var(--text-muted)', opacity: 0.3 }} />
          </div>
        )}
        {/* Active toggle */}
        <button
          onClick={onToggle}
          disabled={isToggling}
          className="absolute top-2 right-2 text-xs font-bold px-2.5 py-1 rounded-full shadow transition-all"
          style={product.isActive !== false
            ? { background: '#DCFCE7', color: '#15803D' }
            : { background: '#F3F4F6', color: '#6B7280' }
          }
          title={product.isActive !== false ? 'Click to hide' : 'Click to show'}
        >
          {isToggling ? <Loader2 size={12} className="animate-spin" /> : (product.isActive !== false ? 'Active' : 'Hidden')}
        </button>
        {outOfStock && (
          <span className="absolute bottom-2 left-2 text-xs font-bold px-2.5 py-1 rounded-full" style={{ background: '#FEE2E2', color: '#DC2626' }}>Out of stock</span>
        )}
        {lowStock && !outOfStock && (
          <span className="absolute bottom-2 left-2 text-xs font-bold px-2.5 py-1 rounded-full" style={{ background: '#FEF3C7', color: '#B45309' }}>Low stock ({totalStock})</span>
        )}
      </div>

      {/* Info */}
      <div className="p-4 flex flex-col gap-2 flex-1">
        <p className="font-semibold text-sm line-clamp-2 leading-snug" style={{ color: 'var(--text)' }}>{product.name}</p>
        <div className="flex items-baseline gap-2">
          {price ? (
            <span className="font-bold text-base" style={{ color: 'var(--primary)' }}>
              {'₹'}{parseFloat(price).toLocaleString('en-IN')}
            </span>
          ) : (
            <span className="text-sm italic" style={{ color: 'var(--text-muted)' }}>Price on enquiry</span>
          )}
          {hasDiscount && (
            <span className="text-xs line-through" style={{ color: 'var(--text-muted)' }}>
              {'₹'}{parseFloat(product.price!).toLocaleString('en-IN')}
            </span>
          )}
          {product.unit && <span className="text-xs" style={{ color: 'var(--text-muted)' }}>/ {product.unit}</span>}
        </div>
        {product.category && (
          <span className="badge badge-brown self-start">{product.category}</span>
        )}
      </div>

      {/* Actions */}
      <div className="flex border-t" style={{ borderColor: 'var(--border)' }}>
        <Link
          href={`/products/${product.id}/edit`}
          className="flex-1 flex items-center justify-center gap-2 py-3 text-sm font-semibold transition-colors"
          style={{ color: 'var(--primary)', borderRight: '1px solid var(--border)' }}
        >
          <Pencil size={14} /> Edit
        </Link>
        <button
          onClick={onDelete}
          disabled={isDeleting}
          className="flex-1 flex items-center justify-center gap-2 py-3 text-sm font-semibold transition-colors disabled:opacity-50"
          style={{ color: 'var(--danger)' }}
        >
          {isDeleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
          Delete
        </button>
      </div>
    </div>
  );
}
