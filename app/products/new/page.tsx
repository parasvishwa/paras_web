'use client';

import { useState, useEffect, useRef, useCallback, DragEvent } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { marketApi } from '@/lib/api';
import { isLoggedIn, getStoredUser } from '@/lib/auth';
import toast from 'react-hot-toast';
import {
  Upload, X, ChevronLeft, ChevronRight, Check,
  ImagePlus, Package, Tag, Layers, Loader2,
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

export default function NewProductPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [categories, setCategories] = useState<Category[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [discountPrice, setDiscountPrice] = useState('');
  const [unit, setUnit] = useState('piece');
  const [stock, setStock] = useState('');
  const [selectedCat, setSelectedCat] = useState('');
  const [images, setImages] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [dragging, setDragging] = useState(false);
  const [catError, setCatError] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isLoggedIn()) { router.replace('/login'); return; }
    const user = getStoredUser();
    const roles: string[] = Array.isArray(user?.role) ? user.role : [];
    const canSell = ['Vendor', 'Gaushala', 'NGO', 'Expert'].some((r) => roles.includes(r));
    if (!canSell) router.replace('/market');
  }, [router]);

  const loadCategories = useCallback(() => {
    setCatError(false);
    marketApi.getCategories()
      .then((res) => {
        const raw = res.data?.data ?? res.data ?? {};
        const list: Category[] = Array.isArray(raw.product_category)
          ? raw.product_category
          : Array.isArray(raw.categories) ? raw.categories
          : Array.isArray(raw) ? raw : [];
        setCategories(list.slice(0, 40));
        if (list.length === 0) setCatError(true);
      })
      .catch(() => setCatError(true));
  }, []);

  useEffect(() => { loadCategories(); }, [loadCategories]);

  const addFiles = useCallback((files: FileList | null) => {
    if (!files || images.length >= 10) return;
    const allowed = Array.from(files ?? []).filter((f) => f.type.startsWith('image/'));
    const slots = 10 - images.length;
    const toAdd = allowed.slice(0, slots);
    if (!toAdd.length) return;
    const oversized = toAdd.find((f) => f.size > 10 * 1024 * 1024);
    if (oversized) {
      toast.error(`"${oversized.name}" exceeds 10 MB.`);
      return;
    }
    const newPreviews = toAdd.map((f) => URL.createObjectURL(f));
    setImages((prev) => [...prev, ...toAdd]);
    setPreviews((prev) => [...prev, ...newPreviews]);
  }, [images.length]);

  const removeImage = (i: number) => {
    URL.revokeObjectURL(previews[i]);
    setImages((prev) => prev.filter((_, idx) => idx !== i));
    setPreviews((prev) => prev.filter((_, idx) => idx !== i));
  };

  const onDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragging(false);
    addFiles(e.dataTransfer.files);
  };

  const step1Valid = name.trim().length > 0 && price.trim().length > 0 && Number(price) > 0;
  const step2Valid = selectedCat.length > 0;
  const step3Valid = images.length > 0;
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
      fd.append('unit', unit);
      if (stock && Number(stock) > 0) fd.append('stock', stock);
      fd.append('category', selectedCat);
      images.forEach((img) => fd.append('images', img));
      await marketApi.createProduct(fd);
      toast.success('Product listed!');
      router.push('/seller/products');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Failed. Please try again.';
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

  return (
    <div className="max-w-xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text)' }}>List a Product</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Add your gau product to the Gaubook marketplace</p>
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
        {/* Step 1 */}
        {step === 0 && (
          <div className="space-y-5">
            <h2 className="font-bold text-lg" style={{ color: 'var(--text)' }}>Basic Information</h2>
            <div>
              <label className="label">Product name *</label>
              <input className="input" placeholder="e.g. Pure A2 Ghee" value={name} onChange={(e) => setName(e.target.value)} maxLength={120} />
            </div>
            <div>
              <label className="label">Description</label>
              <textarea className="input resize-none" rows={4} placeholder="Describe your product — ingredients, benefits, how it's made…" value={description} onChange={(e) => setDescription(e.target.value)} maxLength={1000} />
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
            {discountPrice && Number(discountPrice) >= Number(price) && Number(price) > 0 && (
              <p className="text-xs font-medium" style={{ color: 'var(--danger)' }}>Sale price must be less than the original price.</p>
            )}
            <div>
              <label className="label">Unit</label>
              <select className="input" value={unit} onChange={(e) => setUnit(e.target.value)}>
                {UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Stock quantity</label>
              <input className="input" type="number" placeholder="Leave blank for unlimited" min="0" step="1" value={stock} onChange={(e) => setStock(e.target.value)} />
              <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Leave blank if stock is unlimited or tracked via product variations.</p>
            </div>
          </div>
        )}

        {/* Step 2 */}
        {step === 1 && (
          <div className="space-y-5">
            <h2 className="font-bold text-lg" style={{ color: 'var(--text)' }}>Choose a Category</h2>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Select the category that best describes your product.</p>
            {catError ? (
              <div className="flex flex-col items-center gap-3 py-10">
                <p className="text-sm" style={{ color: 'var(--danger)' }}>Failed to load categories.</p>
                <button onClick={loadCategories} className="btn-outline text-sm px-4">Retry</button>
              </div>
            ) : categories.length === 0 ? (
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

        {/* Step 3 */}
        {step === 2 && (
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-lg" style={{ color: 'var(--text)' }}>Product Images</h2>
              <span className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>{images.length} / 10</span>
            </div>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Add up to 10 photos for your product. The first image will be the cover.</p>
            {images.length < 10 && (
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
            )}
            {previews.length > 0 && (
              <div className="grid grid-cols-3 gap-3">
                {previews.map((src, i) => (
                  <div key={i} className="relative group aspect-square rounded-xl overflow-hidden" style={{ background: 'var(--canvas)', position: 'relative' }}>
                    <Image src={src} alt="" fill style={{ objectFit: 'cover' }} />
                    {i === 0 && (
                      <span className="absolute top-1.5 left-1.5 text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: 'var(--primary)', color: 'white' }}>Cover</span>
                    )}
                    <button onClick={() => removeImage(i)} className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow" style={{ background: 'rgba(0,0,0,0.6)', color: 'white' }}>
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}
            {images.length === 0 && (
              <p className="text-xs font-medium text-center" style={{ color: 'var(--danger)' }}>At least one image is required.</p>
            )}
          </div>
        )}
      </div>

      {/* Nav buttons */}
      <div className="flex items-center justify-between mt-6 gap-3">
        <button onClick={goPrev} disabled={step === 0} className="btn-outline py-3 px-5 disabled:opacity-40">
          <ChevronLeft size={18} /> Back
        </button>
        <div className="flex-1 text-center">
          <span className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>Step {step + 1} of {STEPS.length}</span>
        </div>
        <button
          onClick={goNext}
          disabled={!canAdvance[step] || submitting || (step === 1 && !selectedCat) || (step === 0 && !!discountPrice && Number(discountPrice) >= Number(price) && Number(price) > 0)}
          className="btn-primary py-3 px-5 disabled:opacity-50"
        >
          {submitting ? <><Loader2 size={16} className="animate-spin" /> Uploading…</>
            : step === 2 ? <><Check size={16} /> Publish</>
            : <>Next <ChevronRight size={18} /></>}
        </button>
      </div>

      <div className="text-center mt-4">
        <button onClick={() => router.push('/market')} className="text-sm" style={{ color: 'var(--text-muted)' }}>
          Discard and go back
        </button>
      </div>
    </div>
  );
}
