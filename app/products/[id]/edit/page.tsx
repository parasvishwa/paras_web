'use client';

import { useState, useEffect, useRef, useCallback, DragEvent } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { marketApi } from '@/lib/api';
import { isLoggedIn, getStoredUser } from '@/lib/auth';
import toast from 'react-hot-toast';
import {
  Upload, X, ChevronLeft, ChevronRight, Check,
  ImagePlus, Package, Tag, Layers, Loader2, AlertTriangle,
} from 'lucide-react';

interface Category {
  id?: string | number;
  name?: string;
  value?: string;
}

const UNITS = ['kg', 'g', 'L', 'ml', 'piece', 'dozen', 'pack'];

const STEPS = [
  { icon: Package, label: 'Basic Info' },
  { icon: Tag, label: 'Category' },
  { icon: ImagePlus, label: 'Images' },
];

function catKey(c: Category) { return c.name ?? String(c.id ?? ''); }
function catLabel(c: Category) { return c.value ?? c.name ?? String(c.id ?? ''); }

export default function EditProductPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const productId = params.id;

  const [step, setStep] = useState(0);
  const [categories, setCategories] = useState<Category[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [loadingProduct, setLoadingProduct] = useState(true);
  const [notFound, setNotFound] = useState(false);

  // Form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [discountPrice, setDiscountPrice] = useState('');
  const [unit, setUnit] = useState('piece');
  const [selectedCat, setSelectedCat] = useState('');

  // Images: existing URLs + new files
  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [newImages, setNewImages] = useState<File[]>([]);
  const [newPreviews, setNewPreviews] = useState<string[]>([]);
  const [removedExisting, setRemovedExisting] = useState<Set<number>>(new Set());
  const [dragging, setDragging] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isLoggedIn()) { router.replace('/login'); return; }
    const user = getStoredUser();
    const roles: string[] = Array.isArray(user?.role) ? user.role : [];
    const canSell = ['Vendor', 'Gaushala', 'NGO', 'Expert'].some((r) => roles.includes(r));
    if (!canSell) router.replace('/market');
  }, [router]);

  // Load product + categories in parallel
  useEffect(() => {
    Promise.all([
      marketApi.getProductById(productId),
      marketApi.getCategories(),
    ])
      .then(([prodRes, catRes]) => {
        const prod = prodRes.data?.data ?? prodRes.data;
        if (!prod) { setNotFound(true); return; }

        setName(prod.name ?? '');
        setDescription(prod.description ?? '');
        setPrice(prod.price != null ? String(prod.price) : '');
        setDiscountPrice(prod.discountPrice != null && Number(prod.discountPrice) > 0 ? String(prod.discountPrice) : '');
        setUnit(prod.unit ?? 'piece');
        setSelectedCat(prod.category ?? '');
        setExistingImages(prod.imageUrl ? [prod.imageUrl] : []);

        const raw = catRes.data?.data ?? catRes.data ?? {};
        const list: Category[] = Array.isArray(raw.product_category)
          ? raw.product_category
          : Array.isArray(raw.categories) ? raw.categories
          : Array.isArray(raw) ? raw : [];
        setCategories(list.slice(0, 40));
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoadingProduct(false));
  }, [productId]);

  const totalImageCount = existingImages.filter((_, i) => !removedExisting.has(i)).length + newImages.length;

  const addFiles = useCallback((files: FileList | null) => {
    if (!files) return;
    const allowed = Array.from(files).filter((f) => f.type.startsWith('image/'));
    const toAdd = allowed.slice(0, 5 - totalImageCount);
    if (!toAdd.length) return;
    setNewImages((prev) => [...prev, ...toAdd]);
    toAdd.forEach((f) => setNewPreviews((prev) => [...prev, URL.createObjectURL(f)]));
  }, [totalImageCount]);

  const removeExisting = (i: number) => setRemovedExisting((prev) => new Set([...prev, i]));
  const removeNew = (i: number) => {
    URL.revokeObjectURL(newPreviews[i]);
    setNewImages((prev) => prev.filter((_, idx) => idx !== i));
    setNewPreviews((prev) => prev.filter((_, idx) => idx !== i));
  };

  const onDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragging(false);
    addFiles(e.dataTransfer.files);
  };

  const step1Valid = name.trim().length > 0 && price.trim().length > 0 && Number(price) > 0;
  const step2Valid = selectedCat.length > 0;
  const step3Valid = totalImageCount > 0;
  const canAdvance = [step1Valid, step2Valid, step3Valid];

  const handleSubmit = async () => {
    if (!step1Valid || !step2Valid || !step3Valid) return;
    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append('name', name.trim());
      fd.append('description', description.trim());
      fd.append('price', price);
      if (discountPrice && Number(discountPrice) > 0) fd.append('discountPrice', discountPrice);
      else fd.append('discountPrice', '0');
      fd.append('unit', unit);
      fd.append('category', selectedCat);

      // Tell the backend which existing images to keep
      const kept = existingImages.filter((_, i) => !removedExisting.has(i));
      kept.forEach((url) => fd.append('existingImages', url));

      // New image files
      newImages.forEach((img) => fd.append('images', img));

      await marketApi.updateProduct(productId, fd);
      toast.success('Product updated!');
      router.push('/seller/products');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Update failed. Please try again.';
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const goNext = () => {
    if (step < 2 && canAdvance[step]) setStep((s) => s + 1);
    else if (step === 2) handleSubmit();
  };
  const goPrev = () => { if (step > 0) setStep((s) => s - 1); };

  if (loadingProduct) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 flex items-center justify-center gap-3" style={{ color: 'var(--text-muted)' }}>
        <Loader2 size={22} className="animate-spin" style={{ color: 'var(--primary)' }} />
        <span className="text-sm">Loading product…</span>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center">
        <AlertTriangle size={36} className="mx-auto mb-3" style={{ color: 'var(--danger)' }} />
        <h2 className="font-bold text-lg mb-2" style={{ color: 'var(--text)' }}>Product not found</h2>
        <p className="text-sm mb-5" style={{ color: 'var(--text-muted)' }}>This product may have been deleted or you don&apos;t have access.</p>
        <button onClick={() => router.push('/seller/products')} className="btn-primary">Back to products</button>
      </div>
    );
  }

  const keptExisting = existingImages.filter((_, i) => !removedExisting.has(i));
  const discountInvalid = !!discountPrice && Number(discountPrice) >= Number(price) && Number(price) > 0;

  return (
    <div className="max-w-xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text)' }}>Edit Product</h1>
        <p className="text-sm mt-1 truncate" style={{ color: 'var(--text-muted)' }}>{name}</p>
      </div>

      {/* Progress */}
      <div className="flex items-center mb-8">
        {STEPS.map(({ icon: Icon, label }, i) => (
          <div key={i} className="flex items-center flex-1">
            <div className="flex flex-col items-center gap-1.5">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 font-bold text-sm"
                style={
                  i < step
                    ? { background: 'var(--primary)', color: 'white' }
                    : i === step
                    ? { background: 'var(--primary)', color: 'white', boxShadow: '0 0 0 4px var(--primary-light)' }
                    : { background: 'var(--canvas)', color: 'var(--text-muted)', border: '2px solid var(--border)' }
                }
              >
                {i < step ? <Check size={16} /> : <Icon size={16} />}
              </div>
              <span className="text-xs font-semibold whitespace-nowrap" style={{ color: i <= step ? 'var(--primary)' : 'var(--text-muted)' }}>
                {label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div className="flex-1 h-0.5 mx-2 mb-5 transition-colors duration-300" style={{ background: i < step ? 'var(--primary)' : 'var(--border)' }} />
            )}
          </div>
        ))}
      </div>

      <div className="card p-6">
        {/* Step 1 — Basic Info */}
        {step === 0 && (
          <div className="space-y-5">
            <h2 className="font-bold text-lg" style={{ color: 'var(--text)' }}>Basic Information</h2>
            <div>
              <label className="label">Product name *</label>
              <input className="input" placeholder="e.g. Pure A2 Ghee" value={name} onChange={(e) => setName(e.target.value)} maxLength={120} />
            </div>
            <div>
              <label className="label">Description</label>
              <textarea className="input resize-none" rows={4} placeholder="Describe your product…" value={description} onChange={(e) => setDescription(e.target.value)} maxLength={1000} />
              <p className="text-xs mt-1 text-right" style={{ color: 'var(--text-muted)' }}>{description.length}/1000</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Price (₹) *</label>
                <input className="input" type="number" placeholder="0" min="0" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} />
              </div>
              <div>
                <label className="label">Sale price (₹)</label>
                <input className="input" type="number" placeholder="Optional" min="0" step="0.01" value={discountPrice} onChange={(e) => setDiscountPrice(e.target.value)} />
              </div>
            </div>
            {discountInvalid && (
              <p className="text-xs font-medium" style={{ color: 'var(--danger)' }}>Sale price must be less than the original price.</p>
            )}
            <div>
              <label className="label">Unit</label>
              <select className="input" value={unit} onChange={(e) => setUnit(e.target.value)}>
                {UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
          </div>
        )}

        {/* Step 2 — Category */}
        {step === 1 && (
          <div className="space-y-5">
            <h2 className="font-bold text-lg" style={{ color: 'var(--text)' }}>Choose a Category</h2>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Select the category that best describes your product.</p>
            {categories.length === 0 ? (
              <div className="flex items-center justify-center py-10 gap-2" style={{ color: 'var(--text-muted)' }}>
                <Loader2 size={20} className="animate-spin" />
                <span className="text-sm">Loading categories…</span>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-96 overflow-y-auto pr-1">
                {categories.map((cat, i) => {
                  const key = catKey(cat);
                  const active = selectedCat === key;
                  return (
                    <button
                      key={cat.id ?? i}
                      onClick={() => setSelectedCat(active ? '' : key)}
                      className="p-3 rounded-xl text-sm font-semibold text-left transition-all border"
                      style={active
                        ? { background: 'var(--primary-light)', color: 'var(--primary)', border: '2px solid var(--primary)' }
                        : { background: 'var(--surface)', color: 'var(--text)', border: '2px solid var(--border)' }
                      }
                    >
                      <Layers size={14} className="mb-1.5" style={{ color: active ? 'var(--primary)' : 'var(--text-muted)' }} />
                      <span className="line-clamp-2">{catLabel(cat)}</span>
                      {active && <Check size={12} className="mt-1" style={{ color: 'var(--primary)' }} />}
                    </button>
                  );
                })}
              </div>
            )}
            {selectedCat && (
              <div className="flex items-center gap-2 text-sm font-medium px-3 py-2 rounded-lg" style={{ background: 'var(--primary-light)', color: 'var(--primary)' }}>
                <Check size={14} /> Selected: {selectedCat}
              </div>
            )}
          </div>
        )}

        {/* Step 3 — Images */}
        {step === 2 && (
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-lg" style={{ color: 'var(--text)' }}>Product Images</h2>
              <span className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>{totalImageCount} / 5</span>
            </div>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Keep, remove or add images. The first image will be the cover photo.</p>

            {/* Existing images */}
            {keptExisting.length > 0 && (
              <div>
                <p className="label mb-2">Current images</p>
                <div className="grid grid-cols-3 gap-3">
                  {existingImages.map((url, i) => {
                    if (removedExisting.has(i)) return null;
                    return (
                      <div key={i} className="relative group aspect-square rounded-xl overflow-hidden" style={{ background: 'var(--canvas)' }}>
                        <img src={url} alt="" className="w-full h-full object-cover" />
                        {i === 0 && keptExisting[0] === url && (
                          <span className="absolute top-1.5 left-1.5 text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: 'var(--primary)', color: 'white' }}>Cover</span>
                        )}
                        <button
                          onClick={() => removeExisting(i)}
                          className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow"
                          style={{ background: 'rgba(220, 38, 38, 0.85)', color: 'white' }}
                        >
                          <X size={12} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Upload new */}
            {totalImageCount < 5 && (
              <div>
                {keptExisting.length > 0 && <p className="label mb-2">Add more images</p>}
                <div
                  onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                  onDragLeave={() => setDragging(false)}
                  onDrop={onDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed rounded-2xl flex flex-col items-center justify-center gap-3 py-10 cursor-pointer transition-colors"
                  style={{ borderColor: dragging ? 'var(--primary)' : 'var(--border)', background: dragging ? 'var(--primary-light)' : 'var(--canvas)' }}
                >
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: 'var(--primary-light)' }}>
                    <Upload size={24} style={{ color: 'var(--primary)' }} />
                  </div>
                  <div className="text-center">
                    <p className="font-semibold text-sm" style={{ color: 'var(--text)' }}>Drag & drop or <span style={{ color: 'var(--primary)' }}>browse</span></p>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>JPG, PNG, WebP — up to 10 MB each</p>
                  </div>
                  <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={(e) => addFiles(e.target.files)} />
                </div>
              </div>
            )}

            {/* New image previews */}
            {newPreviews.length > 0 && (
              <div>
                <p className="label mb-2">New images</p>
                <div className="grid grid-cols-3 gap-3">
                  {newPreviews.map((src, i) => (
                    <div key={i} className="relative group aspect-square rounded-xl overflow-hidden" style={{ background: 'var(--canvas)' }}>
                      <img src={src} alt="" className="w-full h-full object-cover" />
                      <button
                        onClick={() => removeNew(i)}
                        className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow"
                        style={{ background: 'rgba(0,0,0,0.6)', color: 'white' }}
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {totalImageCount === 0 && (
              <p className="text-xs font-medium text-center" style={{ color: 'var(--danger)' }}>At least one image is required.</p>
            )}
          </div>
        )}
      </div>

      {/* Nav */}
      <div className="flex items-center justify-between mt-6 gap-3">
        <button onClick={goPrev} disabled={step === 0} className="btn-outline py-3 px-5 disabled:opacity-40">
          <ChevronLeft size={18} /> Back
        </button>
        <div className="flex-1 text-center">
          <span className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>Step {step + 1} of {STEPS.length}</span>
        </div>
        <button
          onClick={goNext}
          disabled={!canAdvance[step] || submitting || discountInvalid}
          className="btn-primary py-3 px-5 disabled:opacity-50"
        >
          {submitting ? <><Loader2 size={16} className="animate-spin" /> Saving…</>
            : step === 2 ? <><Check size={16} /> Save changes</>
            : <>Next <ChevronRight size={18} /></>}
        </button>
      </div>

      <div className="text-center mt-4">
        <button onClick={() => router.push('/seller/products')} className="text-sm" style={{ color: 'var(--text-muted)' }}>
          Discard and go back
        </button>
      </div>
    </div>
  );
}
