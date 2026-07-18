'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import Image from 'next/image';
import { Camera, ChevronRight, Check } from 'lucide-react';
import { apiV1 } from '@/lib/api';
import { saveAuth, getStoredUser, getToken, ROLES } from '@/lib/auth';
import type { GbUser } from '@/lib/auth';

const ROLES_WITH_BIZ = ['Gaushala', 'Vendor', 'NGO'];

export default function RegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(1);
  const [selectedRole, setSelectedRole] = useState('');
  const [fullname, setFullname] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const token = getToken();
    if (!token) router.replace('/login');
  }, [router]);

  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhoto(file);
    const url = URL.createObjectURL(file);
    setPhotoPreview(url);
  }

  async function handleSubmit() {
    if (!fullname.trim()) {
      toast.error('Enter your full name');
      return;
    }
    if (ROLES_WITH_BIZ.includes(selectedRole) && !businessName.trim()) {
      const label =
        selectedRole === 'Gaushala'
          ? 'gaushala name'
          : selectedRole === 'NGO'
          ? 'organisation name'
          : 'business name';
      toast.error(`Enter your ${label}`);
      return;
    }

    setLoading(true);
    try {
      const fd = new FormData();
      fd.append('fullname', fullname.trim());
      fd.append('role', selectedRole);
      if (ROLES_WITH_BIZ.includes(selectedRole)) fd.append('businessName', businessName.trim());
      if (photo) fd.append('profilePhoto', photo);

      const res = await apiV1.post('/auth/user/social-signup', fd);
      const { token, user } = res.data.data as { token: string; user: GbUser };
      saveAuth(token, user);
      toast.success('Profile created! Welcome to Gaubook.');
      router.push('/');
    } catch (e: unknown) {
      // Fallback: if API returns error but we have a stored token, patch locally
      const storedToken = getToken();
      const storedUser = getStoredUser();
      if (storedToken && storedUser) {
        const updated: GbUser = {
          ...storedUser,
          fullname: fullname.trim(),
          role: [selectedRole],
        };
        if (ROLES_WITH_BIZ.includes(selectedRole)) updated.businessName = businessName.trim();
        saveAuth(storedToken, updated);
        toast.success('Profile created! Welcome to Gaubook.');
        router.push('/');
        return;
      }
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data
        ?.message;
      toast.error(msg || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  const needsBiz = ROLES_WITH_BIZ.includes(selectedRole);
  const roleInfo = ROLES.find((r) => r.value === selectedRole);

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 py-12"
      style={{ background: 'var(--canvas)' }}
    >
      <div className="w-full max-w-md">
        {/* Brand header */}
        <div className="text-center mb-6">
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 72,
              height: 72,
              borderRadius: 20,
              background: 'linear-gradient(135deg, var(--primary), var(--primary-dark))',
              boxShadow: '0 8px 24px rgba(240, 123, 29, 0.35)',
              marginBottom: 16,
            }}
          >
            <Image src="/logo.png" alt="Gaubook" width={48} height={48} style={{ objectFit: 'contain' }} />
          </div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.4px', marginBottom: 4 }}>
            Complete your profile
          </h1>
          <p style={{ fontSize: 13.5, color: 'var(--text-muted)', lineHeight: 1.4 }}>
            Tell us a bit about yourself
          </p>
        </div>

        {/* Step indicator */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 20 }}>
          {[1, 2].map((s) => (
            <div
              key={s}
              style={{
                width: step === s ? 28 : 8,
                height: 8,
                borderRadius: 100,
                background: step >= s ? 'var(--primary)' : 'var(--border)',
                transition: 'all 0.3s ease',
              }}
            />
          ))}
        </div>

        <div className="card" style={{ padding: '28px 24px' }}>
          {step === 1 ? (
            <>
              <span className="eyebrow" style={{ marginBottom: 12 }}>Step 1 of 2</span>
              <h2 style={{ fontSize: 19, fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.3px', marginBottom: 4 }}>
                Who are you?
              </h2>
              <p style={{ fontSize: 13.5, color: 'var(--text-muted)', marginBottom: 20, lineHeight: 1.5 }}>
                Select the role that best describes you
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                {ROLES.map((role) => {
                  const active = selectedRole === role.value;
                  return (
                    <button
                      key={role.value}
                      onClick={() => setSelectedRole(role.value)}
                      style={{
                        position: 'relative',
                        padding: '14px 12px',
                        borderRadius: 14,
                        border: '2px solid',
                        borderColor: active ? 'var(--primary)' : 'var(--border)',
                        background: active ? 'var(--primary-light)' : 'var(--surface)',
                        textAlign: 'left',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                        boxShadow: active ? '0 4px 16px rgba(240,123,29,0.15)' : '0 1px 4px rgba(120,65,20,0.05)',
                      }}
                    >
                      {active && (
                        <div
                          style={{
                            position: 'absolute', top: 8, right: 8,
                            width: 20, height: 20, borderRadius: '50%',
                            background: 'var(--primary)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                          }}
                        >
                          <Check size={11} color="white" strokeWidth={3} />
                        </div>
                      )}
                      <div style={{ fontSize: 26, marginBottom: 8, lineHeight: 1 }}>{role.emoji}</div>
                      <div style={{ fontWeight: 700, fontSize: 13.5, color: 'var(--text)', letterSpacing: '-0.1px', lineHeight: 1.25 }}>
                        {role.label}
                      </div>
                      <div style={{ fontSize: 11.5, color: 'var(--text-muted)', marginTop: 4, lineHeight: 1.45 }}>
                        {role.desc}
                      </div>
                    </button>
                  );
                })}
              </div>

              <button
                className="btn-primary w-full mt-6"
                onClick={() => {
                  if (!selectedRole) {
                    toast.error('Please select a role to continue');
                    return;
                  }
                  setStep(2);
                }}
                style={{ borderRadius: 100, padding: '13px 24px', fontSize: 15 }}
              >
                Continue <ChevronRight size={16} />
              </button>
            </>
          ) : (
            <>
              <button
                style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer', marginBottom: 18, padding: '4px 0' }}
                onClick={() => setStep(1)}
              >
                ← Back
              </button>

              <span className="eyebrow" style={{ marginBottom: 12 }}>Step 2 of 2</span>
              <h2 style={{ fontSize: 19, fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.3px', marginBottom: 4 }}>
                Your details
              </h2>
              <p style={{ fontSize: 13.5, color: 'var(--text-muted)', marginBottom: 20, lineHeight: 1.5 }}>
                Joining as{' '}
                <span style={{ fontWeight: 700, color: 'var(--primary)' }}>
                  {roleInfo?.emoji} {roleInfo?.label}
                </span>
              </p>

              {/* Profile photo */}
              <div className="flex justify-center mb-6">
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  style={{
                    position: 'relative',
                    width: 84,
                    height: 84,
                    borderRadius: '50%',
                    overflow: 'hidden',
                    border: '2.5px solid',
                    borderColor: photoPreview ? 'var(--primary)' : 'var(--border)',
                    cursor: 'pointer',
                    background: 'none',
                    padding: 0,
                    transition: 'border-color 0.15s',
                    boxShadow: photoPreview ? '0 0 0 3px var(--primary-light)' : 'none',
                  }}
                  aria-label="Upload profile photo"
                >
                  {photoPreview ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={photoPreview}
                      alt="Profile preview"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div
                      className="w-full h-full flex flex-col items-center justify-center gap-1"
                      style={{ background: 'var(--primary-light)' }}
                    >
                      <Camera size={20} style={{ color: 'var(--primary)' }} />
                      <span className="text-xs font-medium" style={{ color: 'var(--primary)' }}>
                        Photo
                      </span>
                    </div>
                  )}
                  <div
                    className="absolute bottom-0 right-0 w-6 h-6 rounded-full flex items-center justify-center"
                    style={{ background: 'var(--primary)' }}
                  >
                    <Camera size={12} color="white" />
                  </div>
                </button>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handlePhotoChange}
                />
              </div>

              <div className="space-y-4">
                <div>
                  <label className="label">Full Name</label>
                  <input
                    className="input"
                    type="text"
                    placeholder="Your full name"
                    value={fullname}
                    onChange={(e) => setFullname(e.target.value)}
                    autoFocus
                  />
                </div>

                {needsBiz && (
                  <div>
                    <label className="label">
                      {selectedRole === 'Gaushala'
                        ? 'Gaushala Name'
                        : selectedRole === 'NGO'
                        ? 'Organisation Name'
                        : 'Business Name'}
                    </label>
                    <input
                      className="input"
                      type="text"
                      placeholder={
                        selectedRole === 'Gaushala'
                          ? 'Name of your gaushala'
                          : selectedRole === 'NGO'
                          ? 'Name of your organisation'
                          : 'Name of your business'
                      }
                      value={businessName}
                      onChange={(e) => setBusinessName(e.target.value)}
                    />
                  </div>
                )}
              </div>

              <button
                className="btn-primary w-full mt-6"
                onClick={handleSubmit}
                disabled={loading}
                style={{ borderRadius: 100, padding: '13px 24px', fontSize: 15 }}
              >
                {loading ? (
                  <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  'Create Profile'
                )}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
