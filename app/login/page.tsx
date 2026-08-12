'use client';

import { useState, useRef, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import toast from 'react-hot-toast';
import Image from 'next/image';
import { ArrowRight, RefreshCw } from 'lucide-react';
import { authApi } from '@/lib/api';
import { saveAuth } from '@/lib/auth';
import type { GbUser } from '@/lib/auth';
import { useI18n } from '@/lib/i18n/I18nContext';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useI18n();
  const rawNext = searchParams.get('next') ?? '/';
  const next = rawNext.startsWith('/') && !rawNext.startsWith('//') ? rawNext : '/';
  const [step, setStep] = useState<1 | 2>(1);
  const [mobile, setMobile] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [timer, setTimer] = useState(0);
  const [pinId, setPinId] = useState('');
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (timer <= 0) return;
    const id = setTimeout(() => setTimer((t) => t - 1), 1000);
    return () => clearTimeout(id);
  }, [timer]);

  async function handleSendOtp() {
    const cleaned = mobile.trim().replace(/\D/g, '');
    if (cleaned.length !== 10) {
      toast.error(t('pleaseEnterValid10Digit'));
      return;
    }
    setLoading(true);
    try {
      const res = await authApi.sendOtp(cleaned);
      setPinId(res.data?.data?.pinId ?? '');
      toast.success(t('sendOtp'));
      setStep(2);
      setTimer(30);
      setTimeout(() => otpRefs.current[0]?.focus(), 100);
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg || t('somethingWentWrong'));
    } finally {
      setLoading(false);
    }
  }

  function handleOtpChange(idx: number, val: string) {
    const digit = val.replace(/\D/g, '').slice(-1);
    const next = [...otp];
    next[idx] = digit;
    setOtp(next);
    if (digit && idx < 5) {
      otpRefs.current[idx + 1]?.focus();
    }
  }

  function handleOtpKeyDown(idx: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Backspace' && !otp[idx] && idx > 0) {
      otpRefs.current[idx - 1]?.focus();
    }
  }

  function handleOtpPaste(e: React.ClipboardEvent) {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    const next = [...otp];
    for (let i = 0; i < pasted.length; i++) next[i] = pasted[i];
    setOtp(next);
    const focusIdx = Math.min(pasted.length, 5);
    otpRefs.current[focusIdx]?.focus();
  }

  async function handleVerify() {
    if (!pinId) {
      toast.error('OTP session expired. Please request a new OTP.');
      setStep(1);
      return;
    }
    const code = otp.join('');
    if (code.length !== 6) {
      toast.error('Enter the complete 6-digit OTP');
      return;
    }
    const cleaned = mobile.trim().replace(/\D/g, '');
    setLoading(true);
    try {
      const res = await authApi.verifyOtp(cleaned, code, pinId);
      const { token, user } = (res.data?.data ?? res.data) as { token: string; user: GbUser };
      saveAuth(token, user);
      const hasRole = Array.isArray(user.role) ? user.role.length > 0 : !!user.role;
      toast.success(hasRole ? t('welcomeBack') : t('otpVerified'));
      router.push(hasRole ? next : '/register');
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg || t('invalidOtp'));
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    if (timer > 0) return;
    const cleaned = mobile.trim().replace(/\D/g, '');
    setLoading(true);
    try {
      const res = await authApi.sendOtp(cleaned);
      setPinId(res.data?.data?.pinId ?? '');
      toast.success(t('resendOtp'));
      setTimer(30);
      setOtp(['', '', '', '', '', '']);
      setTimeout(() => otpRefs.current[0]?.focus(), 50);
    } catch {
      toast.error(t('somethingWentWrong'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 py-12"
      style={{ background: 'var(--canvas)' }}
    >
      <div className="w-full max-w-sm">
        {/* Brand header */}
        <div className="text-center mb-8">
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
          <h1 style={{ fontSize: 26, fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.5px', marginBottom: 4 }}>
            Gaubook
          </h1>
          <p style={{ fontSize: 13.5, color: 'var(--text-muted)', lineHeight: 1.4 }}>
            India&apos;s Largest Gau Community
          </p>
        </div>

        <div className="card" style={{ padding: '28px 24px' }}>
          {step === 1 ? (
            <>
              <span className="eyebrow" style={{ marginBottom: 12 }}>{t('welcomeBack')}</span>
              <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.3px', marginBottom: 4 }}>
                {t('signIn')}
              </h2>
              <p style={{ fontSize: 13.5, color: 'var(--text-muted)', marginBottom: 22, lineHeight: 1.5 }}>
                {t('signInContinue')}
              </p>

              <div className="mb-5">
                <label className="label">{t('mobileNumber')}</label>
                <div className="flex gap-2">
                  <div
                    className="input flex-shrink-0 flex items-center justify-center font-semibold"
                    style={{ width: 'auto', paddingLeft: 14, paddingRight: 14 }}
                  >
                    +91
                  </div>
                  <input
                    className="input"
                    type="tel"
                    inputMode="numeric"
                    placeholder={t('enter10DigitNumber')}
                    maxLength={10}
                    value={mobile}
                    onChange={(e) =>
                      setMobile(e.target.value.replace(/\D/g, '').slice(0, 10))
                    }
                    onKeyDown={(e) => e.key === 'Enter' && handleSendOtp()}
                    autoFocus
                  />
                </div>
              </div>

              <button
                className="btn-primary w-full"
                onClick={handleSendOtp}
                disabled={loading}
                style={{ borderRadius: 100, padding: '13px 24px', fontSize: 15 }}
              >
                {loading ? (
                  <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    {t('sendOtp')} <ArrowRight size={16} />
                  </>
                )}
              </button>
            </>
          ) : (
            <>
              <button
                style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer', marginBottom: 18, padding: '4px 0' }}
                onClick={() => {
                  setStep(1);
                  setOtp(['', '', '', '', '', '']);
                }}
              >
                ← {t('back')}
              </button>

              <span className="eyebrow" style={{ marginBottom: 12 }}>{t('otpVerification')}</span>
              <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.3px', marginBottom: 4 }}>
                {t('verifyOtp')}
              </h2>
              <p style={{ fontSize: 13.5, color: 'var(--text-muted)', marginBottom: 22 }}>
                {t('otpSentTo', { number: `+91 ${mobile}` })}
              </p>

              {/* 6-digit OTP boxes */}
              <div
                style={{ display: 'flex', gap: 8, justifyContent: 'space-between', marginBottom: 22 }}
                onPaste={handleOtpPaste}
              >
                {otp.map((digit, idx) => (
                  <input
                    key={idx}
                    ref={(el) => {
                      otpRefs.current[idx] = el;
                    }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(idx, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                    className="input text-center"
                    style={{
                      width: 44,
                      height: 54,
                      padding: 0,
                      fontSize: 24,
                      fontWeight: 800,
                      letterSpacing: 0,
                      borderRadius: 12,
                      textAlign: 'center',
                      borderColor: digit ? 'var(--primary)' : undefined,
                      background: digit ? 'var(--primary-light)' : undefined,
                    }}
                  />
                ))}
              </div>

              <button
                className="btn-primary w-full mb-4"
                onClick={handleVerify}
                disabled={loading}
                style={{ borderRadius: 100, padding: '13px 24px', fontSize: 15 }}
              >
                {loading ? (
                  <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  t('verifyOtp')
                )}
              </button>

              <div className="text-center text-sm" style={{ color: 'var(--text-muted)' }}>
                {timer > 0 ? (
                  <span>{t('resendIn', { s: String(timer) })}</span>
                ) : (
                  <button
                    className="inline-flex items-center gap-1.5 mx-auto font-semibold"
                    style={{ color: 'var(--primary)' }}
                    onClick={handleResend}
                    disabled={loading}
                  >
                    <RefreshCw size={14} /> {t('resendOtp')}
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh' }} />}>
      <LoginForm />
    </Suspense>
  );
}
