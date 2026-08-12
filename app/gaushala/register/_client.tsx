'use client';

import { useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import {
  ArrowLeft, ArrowRight, Check, Upload, X, MapPin, Phone,
  FileText, Users, Building2, Leaf, ChevronDown,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { apiV1 } from '@/lib/api';
import { isLoggedIn, getStoredUser } from '@/lib/auth';

const INDIAN_STATES = [
  'Andhra Pradesh','Arunachal Pradesh','Assam','Bihar','Chhattisgarh','Goa','Gujarat',
  'Haryana','Himachal Pradesh','Jharkhand','Karnataka','Kerala','Madhya Pradesh',
  'Maharashtra','Manipur','Meghalaya','Mizoram','Nagaland','Odisha','Punjab',
  'Rajasthan','Sikkim','Tamil Nadu','Telangana','Tripura','Uttar Pradesh',
  'Uttarakhand','West Bengal','Delhi','Jammu & Kashmir','Ladakh',
];

const LEGAL_STATUSES = ['Trust', 'Society', 'Section 8 Company', 'Proprietorship', 'Partnership', 'Other'];
const FACILITIES_LIST = ['Veterinary Care', 'Biogas Plant', 'Organic Farming', 'Shelter for Stray Cows', 'Milk Production', 'Gosala Museum', 'Temple', 'Guest Rooms', 'CCTV Surveillance', 'In-house Hospital', '24/7 Security'];

interface FormData {
  // Basic
  gaushalaName: string;
  contactName: string;
  contactPhone: string;
  email: string;
  // Location
  address: string;
  city: string;
  district: string;
  state: string;
  pincode: string;
  // Legal
  legalStatus: string;
  trustRegNo: string;
  darpanNo: string;
  pan: string;
  provides80G: boolean;
  has12A: boolean;
  // Gaushala details
  established: string;
  capacity: string;
  landAcres: string;
  staff: string;
  description: string;
  facilities: string[];
  // Cow census
  nandi: string;
  milkingCows: string;
  nonMilking: string;
  maleCalves: string;
  femaleCalves: string;
  // Bank
  bankName: string;
  accountNo: string;
  ifsc: string;
  upiId: string;
  acceptsGauDaan: boolean;
}

const EMPTY: FormData = {
  gaushalaName: '', contactName: '', contactPhone: '', email: '',
  address: '', city: '', district: '', state: '', pincode: '',
  legalStatus: '', trustRegNo: '', darpanNo: '', pan: '', provides80G: false, has12A: false,
  established: '', capacity: '', landAcres: '', staff: '', description: '', facilities: [],
  nandi: '', milkingCows: '', nonMilking: '', maleCalves: '', femaleCalves: '',
  bankName: '', accountNo: '', ifsc: '', upiId: '', acceptsGauDaan: false,
};

const STEPS = ['Basic Info', 'Location', 'Legal', 'Gaushala Details', 'Documents'];

export default function GaushalaRegisterPageClient() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormData>(EMPTY);
  const [docs, setDocs] = useState<{ name: string; label: string; file: File }[]>([]);
  const [profilePhoto, setProfilePhoto] = useState<File | null>(null);
  const [profilePreview, setProfilePreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const docInputRef = useRef<HTMLInputElement>(null);
  const photoRef = useRef<HTMLInputElement>(null);

  const set = (k: keyof FormData, v: string | boolean | string[]) =>
    setForm(f => ({ ...f, [k]: v }));

  const toggleFacility = (f: string) =>
    set('facilities', form.facilities.includes(f)
      ? form.facilities.filter(x => x !== f)
      : [...form.facilities, f]);

  const addDoc = (label: string, file: File) =>
    setDocs(d => [...d.filter(x => x.label !== label), { name: file.name, label, file }]);

  const removeDoc = (label: string) => setDocs(d => d.filter(x => x.label !== label));

  const validate = (): string | null => {
    if (step === 0) {
      if (!form.gaushalaName.trim()) return 'Gaushala name is required';
      if (!form.contactPhone.trim()) return 'Contact phone is required';
    }
    if (step === 1) {
      if (!form.state) return 'Please select a state';
      if (!form.city.trim()) return 'City is required';
    }
    return null;
  };

  const next = () => {
    const err = validate();
    if (err) { toast.error(err); return; }
    setStep(s => Math.min(s + 1, STEPS.length - 1));
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const fd = new FormData();
      // Core identity fields
      fd.append('fullname', form.contactName || form.gaushalaName);
      fd.append('businessName', form.gaushalaName);
      fd.append('role', 'Gaushala');
      // Location
      if (form.state) fd.append('state', form.state);
      if (form.city) fd.append('city', form.city);
      if (form.district) fd.append('district', form.district);
      if (form.address) fd.append('address', form.address);
      if (form.pincode) fd.append('pincode', form.pincode);
      // Description
      if (form.description) fd.append('description', form.description);
      // Legal
      if (form.legalStatus) fd.append('legalStatus', form.legalStatus);
      if (form.trustRegNo) fd.append('trustRegNo', form.trustRegNo);
      if (form.darpanNo) fd.append('darpanNo', form.darpanNo);
      fd.append('provides80G', String(form.provides80G));
      fd.append('has12A', String(form.has12A));
      // Numbers
      if (form.established) fd.append('establishedYear', form.established);
      if (form.capacity) fd.append('capacity', form.capacity);
      if (form.landAcres) fd.append('landAcres', form.landAcres);
      if (form.staff) fd.append('staff', form.staff);
      // Facilities
      if (form.facilities.length) fd.append('facilities', JSON.stringify(form.facilities));
      // Cow census
      const census: Record<string, number> = {};
      if (form.nandi) census.nandi = Number(form.nandi);
      if (form.milkingCows) census.milkingCows = Number(form.milkingCows);
      if (form.nonMilking) census.nonMilking = Number(form.nonMilking);
      if (form.maleCalves) census.maleCalves = Number(form.maleCalves);
      if (form.femaleCalves) census.femaleCalves = Number(form.femaleCalves);
      if (Object.keys(census).length) fd.append('cowCensus', JSON.stringify(census));
      // Bank
      if (form.upiId) fd.append('upiId', form.upiId);
      fd.append('acceptsGauDaan', String(form.acceptsGauDaan));
      // Photo
      if (profilePhoto) fd.append('profilePhoto', profilePhoto);
      // Documents — append each as a separate file field
      docs.forEach(({ label, file }) => fd.append(label, file));

      if (isLoggedIn()) {
        await apiV1.put('/user/profile', fd, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        toast.success('Registration submitted!');
        router.push('/profile');
      } else {
        // Store form data and redirect to login with returnUrl
        sessionStorage.setItem('gaushala_reg_draft', JSON.stringify(form));
        toast('Please log in or create an account to complete registration', { icon: 'ℹ️' });
        router.push('/login?next=/gaushala/register');
      }
      setSubmitted(true);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg || 'Submission failed — please try again');
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--canvas)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <div style={{ textAlign: 'center', maxWidth: 400 }}>
          <div style={{ width: 72, height: 72, borderRadius: '50%', background: '#E8F5E9', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
            <Check size={36} color="#2E7D32" />
          </div>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text)', marginBottom: 8 }}>Registration Submitted</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: 14, lineHeight: 1.6, marginBottom: 24 }}>
            Your gaushala registration is under review. We&apos;ll contact you on {form.contactPhone || 'your registered number'} within 2-3 working days.
          </p>
          <Link href="/" style={{ display: 'inline-block', padding: '12px 28px', borderRadius: 100, background: 'var(--primary)', color: 'white', fontWeight: 700, fontSize: 14, textDecoration: 'none' }}>
            Back to Feed
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--canvas)', paddingBottom: 100 }}>
      {/* Header */}
      <div style={{ background: 'white', borderBottom: '1px solid var(--border)', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12, position: 'sticky', top: 0, zIndex: 10 }}>
        <button onClick={() => step > 0 ? setStep(s => s - 1) : router.back()}
          style={{ width: 36, height: 36, borderRadius: '50%', border: '1.5px solid var(--border)', background: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
          <ArrowLeft size={18} color="var(--text)" />
        </button>
        <div style={{ flex: 1 }}>
          <h1 style={{ fontSize: 16, fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.2px' }}>Register Your Gaushala</h1>
          <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 1 }}>{STEPS[step]} · Step {step + 1} of {STEPS.length}</p>
        </div>
        <div style={{ display: 'flex', gap: 4 }}>
          {STEPS.map((_, i) => (
            <div key={i} style={{ width: i === step ? 20 : 6, height: 6, borderRadius: 99, background: i <= step ? 'var(--primary)' : 'var(--border)', transition: 'all 0.2s' }} />
          ))}
        </div>
      </div>

      <div style={{ maxWidth: 640, margin: '0 auto', padding: '20px 16px' }}>

        {/* ── Step 0: Basic Info ── */}
        {step === 0 && (
          <Section title="Basic Information" icon={<Building2 size={16} />}>
            {/* Profile photo */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20 }}>
              <button onClick={() => photoRef.current?.click()}
                style={{ width: 72, height: 72, borderRadius: '50%', border: '2px dashed var(--border)', background: profilePreview ? 'none' : 'var(--canvas)', cursor: 'pointer', overflow: 'hidden', position: 'relative', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {profilePreview
                  ? <Image src={profilePreview} alt="" fill style={{ objectFit: 'cover' }} />
                  : <Leaf size={28} color="var(--primary)" />}
              </button>
              <input ref={photoRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => {
                const f = e.target.files?.[0]; if (!f) return;
                if (!f.type.startsWith('image/')) {
                  toast.error('Please select an image file.');
                  e.target.value = '';
                  return;
                }
                if (f.size > 5 * 1024 * 1024) {
                  toast.error('Profile photo must be under 5 MB.');
                  e.target.value = '';
                  return;
                }
                setProfilePhoto(f);
                setProfilePreview(URL.createObjectURL(f));
              }} />
              <div>
                <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', marginBottom: 2 }}>Gaushala Photo</p>
                <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>Upload a clear photo of your gaushala</p>
                <button onClick={() => photoRef.current?.click()} style={{ marginTop: 6, fontSize: 12, fontWeight: 600, color: 'var(--primary)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                  {profilePreview ? 'Change photo' : 'Add photo'}
                </button>
              </div>
            </div>

            <Field label="Gaushala Name *" value={form.gaushalaName} onChange={v => set('gaushalaName', v)} placeholder="e.g. Shri Gau Seva Kendra" />
            <Field label="Contact Person Name" value={form.contactName} onChange={v => set('contactName', v)} placeholder="Full name of the manager / trustee" />
            <Field label="Contact Phone *" value={form.contactPhone} onChange={v => set('contactPhone', v)} placeholder="+91 XXXXX XXXXX" type="tel" />
            <Field label="Email" value={form.email} onChange={v => set('email', v)} placeholder="info@yourgaushala.org" type="email" />
          </Section>
        )}

        {/* ── Step 1: Location ── */}
        {step === 1 && (
          <Section title="Location" icon={<MapPin size={16} />}>
            <Field label="Street Address" value={form.address} onChange={v => set('address', v)} placeholder="Village / locality / street" multiline />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <Field label="City / Town *" value={form.city} onChange={v => set('city', v)} placeholder="City" />
              <Field label="District" value={form.district} onChange={v => set('district', v)} placeholder="District" />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={labelStyle}>State *</label>
                <div style={{ position: 'relative' }}>
                  <select value={form.state} onChange={e => set('state', e.target.value)}
                    style={{ ...inputStyle, appearance: 'none', paddingRight: 32 }}>
                    <option value="">Select state</option>
                    {INDIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                  <ChevronDown size={14} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: 'var(--text-muted)' }} />
                </div>
              </div>
              <Field label="Pincode" value={form.pincode} onChange={v => set('pincode', v)} placeholder="110001" type="tel" maxLength={6} />
            </div>
          </Section>
        )}

        {/* ── Step 2: Legal ── */}
        {step === 2 && (
          <Section title="Legal Information" icon={<FileText size={16} />}>
            <div>
              <label style={labelStyle}>Legal Status</label>
              <div style={{ position: 'relative' }}>
                <select value={form.legalStatus} onChange={e => set('legalStatus', e.target.value)} style={{ ...inputStyle, appearance: 'none', paddingRight: 32 }}>
                  <option value="">Select legal status</option>
                  {LEGAL_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                <ChevronDown size={14} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: 'var(--text-muted)' }} />
              </div>
            </div>
            <Field label="Trust / Society Registration No." value={form.trustRegNo} onChange={v => set('trustRegNo', v)} placeholder="e.g. TR/2010/001234" />
            <Field label="DARPAN Registration No." value={form.darpanNo} onChange={v => set('darpanNo', v)} placeholder="GJ/2015/0012345" />
            <Field label="PAN Number" value={form.pan} onChange={v => set('pan', v)} placeholder="AAATG0000G" />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <Toggle label="Has 80G Certificate" checked={form.provides80G} onChange={v => set('provides80G', v)} />
              <Toggle label="Has 12A Certificate" checked={form.has12A} onChange={v => set('has12A', v)} />
            </div>
          </Section>
        )}

        {/* ── Step 3: Gaushala Details ── */}
        {step === 3 && (
          <>
            <Section title="About the Gaushala" icon={<Leaf size={16} />}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <Field label="Established Year" value={form.established} onChange={v => set('established', v)} placeholder="e.g. 1985" type="tel" />
                <Field label="Cow Capacity" value={form.capacity} onChange={v => set('capacity', v)} placeholder="e.g. 500" type="tel" />
                <Field label="Land (Acres)" value={form.landAcres} onChange={v => set('landAcres', v)} placeholder="e.g. 12" type="tel" />
                <Field label="Staff Count" value={form.staff} onChange={v => set('staff', v)} placeholder="e.g. 20" type="tel" />
              </div>
              <Field label="Description" value={form.description} onChange={v => set('description', v)} placeholder="Tell us about your gaushala, its mission, and activities..." multiline rows={4} />
            </Section>

            <Section title="Cow Census" icon={<Users size={16} />}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <Field label="Nandi (Bulls)" value={form.nandi} onChange={v => set('nandi', v)} placeholder="0" type="tel" />
                <Field label="Milking Cows" value={form.milkingCows} onChange={v => set('milkingCows', v)} placeholder="0" type="tel" />
                <Field label="Non-Milking Cows" value={form.nonMilking} onChange={v => set('nonMilking', v)} placeholder="0" type="tel" />
                <Field label="Male Calves" value={form.maleCalves} onChange={v => set('maleCalves', v)} placeholder="0" type="tel" />
                <Field label="Female Calves" value={form.femaleCalves} onChange={v => set('femaleCalves', v)} placeholder="0" type="tel" />
              </div>
            </Section>

            <Section title="Facilities" icon={<Building2 size={16} />}>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {FACILITIES_LIST.map(f => {
                  const active = form.facilities.includes(f);
                  return (
                    <button key={f} onClick={() => toggleFacility(f)}
                      style={{ padding: '6px 14px', borderRadius: 99, fontSize: 12, fontWeight: 600, cursor: 'pointer', border: `1.5px solid ${active ? 'var(--primary)' : 'var(--border)'}`, background: active ? 'rgba(240,123,29,0.1)' : 'white', color: active ? 'var(--primary)' : 'var(--text-muted)', transition: 'all 0.15s' }}>
                      {f}
                    </button>
                  );
                })}
              </div>
            </Section>

            <Section title="Donations" icon={<Phone size={16} />}>
              <Toggle label="Accept Gau Daan (donations)" checked={form.acceptsGauDaan} onChange={v => set('acceptsGauDaan', v)} />
              {form.acceptsGauDaan && (
                <>
                  <Field label="UPI ID" value={form.upiId} onChange={v => set('upiId', v)} placeholder="gaushala@upi" />
                  <Field label="Bank Name" value={form.bankName} onChange={v => set('bankName', v)} placeholder="Bank name" />
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <Field label="Account Number" value={form.accountNo} onChange={v => set('accountNo', v)} placeholder="Account no." type="tel" />
                    <Field label="IFSC Code" value={form.ifsc} onChange={v => set('ifsc', v)} placeholder="SBIN0001234" />
                  </div>
                </>
              )}
            </Section>
          </>
        )}

        {/* ── Step 4: Documents ── */}
        {step === 4 && (
          <Section title="Upload Documents" icon={<Upload size={16} />}>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 16, lineHeight: 1.55 }}>
              Upload scanned copies or photos of your registration documents. Accepted formats: PDF, JPG, PNG (max 10 MB each).
            </p>
            {DOC_TYPES.map(({ label, hint }) => {
              const uploaded = docs.find(d => d.label === label);
              return (
                <div key={label} style={{ marginBottom: 12 }}>
                  <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--text)', marginBottom: 4 }}>{label}</p>
                  {hint && <p style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 6 }}>{hint}</p>}
                  {uploaded ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', background: '#E8F5E9', borderRadius: 10, border: '1.5px solid #A5D6A7' }}>
                      <FileText size={14} color="#2E7D32" />
                      <span style={{ flex: 1, fontSize: 12, color: '#2E7D32', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{uploaded.name}</span>
                      <button onClick={() => removeDoc(label)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2 }}>
                        <X size={14} color="#2E7D32" />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => {
                        const inp = document.createElement('input');
                        inp.type = 'file'; inp.accept = '.pdf,.jpg,.jpeg,.png';
                        inp.onchange = (e) => {
                          const f = (e.target as HTMLInputElement).files?.[0];
                          if (!f) return;
                          if (!f.type.startsWith('image/') && f.type !== 'application/pdf') {
                            toast.error('Please upload a PDF or image file.');
                            return;
                          }
                          if (f.size > 10 * 1024 * 1024) {
                            toast.error(`"${f.name}" exceeds 10 MB.`);
                            return;
                          }
                          addDoc(label, f);
                        };
                        inp.click();
                      }}
                      style={{ width: '100%', padding: '12px 16px', borderRadius: 10, border: '1.5px dashed var(--border)', background: 'var(--canvas)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10 }}
                    >
                      <Upload size={16} color="var(--text-muted)" />
                      <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>Choose file</span>
                    </button>
                  )}
                </div>
              );
            })}

            {!isLoggedIn() && (
              <div style={{ marginTop: 20, padding: '14px 16px', background: '#FFF3E0', borderRadius: 12, border: '1.5px solid #FFB74D' }}>
                <p style={{ fontSize: 13, fontWeight: 700, color: '#E65100', marginBottom: 4 }}>Login required to submit</p>
                <p style={{ fontSize: 12, color: '#BF360C', lineHeight: 1.5 }}>
                  Your progress is saved. Please <Link href="/login?next=/gaushala/register" style={{ color: 'var(--primary)', fontWeight: 700 }}>log in</Link> or{' '}
                  <Link href="/register" style={{ color: 'var(--primary)', fontWeight: 700 }}>create an account</Link> with role &quot;Gaushala&quot; to complete your registration.
                </p>
              </div>
            )}
          </Section>
        )}

        {/* Navigation buttons */}
        <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
          {step > 0 && (
            <button onClick={() => setStep(s => s - 1)}
              style={{ flex: 1, padding: '13px 0', borderRadius: 100, border: '1.5px solid var(--border)', background: 'white', fontSize: 14, fontWeight: 700, color: 'var(--text)', cursor: 'pointer' }}>
              Back
            </button>
          )}
          {step < STEPS.length - 1 ? (
            <button onClick={next}
              style={{ flex: 2, padding: '13px 0', borderRadius: 100, background: 'var(--primary)', border: 'none', fontSize: 14, fontWeight: 800, color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              Continue <ArrowRight size={16} />
            </button>
          ) : (
            <button onClick={handleSubmit} disabled={submitting}
              style={{ flex: 2, padding: '13px 0', borderRadius: 100, background: submitting ? 'var(--border)' : 'var(--primary)', border: 'none', fontSize: 14, fontWeight: 800, color: 'white', cursor: submitting ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              {submitting ? 'Submitting...' : (<>Submit Registration <Check size={16} /></>)}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Helpers ── */

const DOC_TYPES = [
  { label: 'trustDeed', hint: 'Trust Deed / Society Registration Certificate' },
  { label: 'pan', hint: 'PAN Card of the Trust / Society' },
  { label: 'cert80G', hint: '80G Certificate (if available)' },
  { label: 'cert12A', hint: '12A Certificate (if available)' },
  { label: 'darpan', hint: 'NGO DARPAN Certificate (if available)' },
  { label: 'bankProof', hint: 'Cancelled cheque or bank passbook front page' },
  { label: 'photo1', hint: 'Photo of your gaushala / cows (exterior)' },
  { label: 'photo2', hint: 'Photo of your gaushala / cows (interior)' },
];

const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--text-muted)',
  letterSpacing: 0.4, textTransform: 'uppercase', marginBottom: 5,
};

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '10px 12px', borderRadius: 10, fontSize: 14,
  border: '1.5px solid var(--border)', background: 'white', color: 'var(--text)',
  outline: 'none', boxSizing: 'border-box',
};

function Field({ label, value, onChange, placeholder, type = 'text', multiline, rows = 3, maxLength }: {
  label: string; value: string; onChange: (v: string) => void;
  placeholder?: string; type?: string; multiline?: boolean; rows?: number; maxLength?: number;
}) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={labelStyle}>{label}</label>
      {multiline
        ? <textarea value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} rows={rows}
            style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.5 }} />
        : <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
            maxLength={maxLength} style={inputStyle} />}
    </div>
  );
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <button onClick={() => onChange(!checked)}
        style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
        <div style={{ width: 40, height: 22, borderRadius: 99, background: checked ? 'var(--primary)' : 'var(--border)', position: 'relative', flexShrink: 0, transition: 'background 0.2s' }}>
          <div style={{ position: 'absolute', top: 3, left: checked ? 20 : 3, width: 16, height: 16, borderRadius: '50%', background: 'white', transition: 'left 0.2s', boxShadow: '0 1px 4px rgba(0,0,0,0.2)' }} />
        </div>
        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{label}</span>
      </button>
    </div>
  );
}

function Section({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div style={{ background: 'white', borderRadius: 16, border: '1px solid var(--border)', padding: '16px', marginBottom: 14, boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, paddingBottom: 12, borderBottom: '1px solid var(--border)' }}>
        <div style={{ color: 'var(--primary)' }}>{icon}</div>
        <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.1px' }}>{title}</span>
      </div>
      {children}
    </div>
  );
}
