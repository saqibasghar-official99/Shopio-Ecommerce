'use client';

import { FormEvent, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Store, Mail, Phone, User, Lock, ShieldCheck, CheckCircle2, ArrowRight,
  ArrowLeft, Sparkles, BadgeCheck, KeyRound, RefreshCw, Eye, EyeOff,
  Package, Wallet, Gift, TrendingUp
} from 'lucide-react';

export default function SellerRegistrationPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '' });
  const [phase, setPhase] = useState<'application' | 'verification' | 'verified'>('application');
  const [otp, setOtp] = useState('');
  const [feedback, setFeedback] = useState<{ type: 'error' | 'success'; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('verify') === '1') {
      setForm((current) => ({ ...current, email: params.get('email') || current.email }));
      setPhase('verification');
    }
  }, []);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setFeedback(null);
    try {
      const response = await fetch('/api/seller/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const result = await response.json();
      if (result.verificationRequired) {
        setForm((current) => ({ ...current, email: current.email.trim().toLowerCase() }));
        setPhase('verification');
        setFeedback({ type: 'error', text: result.message || 'Please verify your email address.' });
        return;
      }
      if (!response.ok) throw new Error(result.message || 'Could not submit application.');
      setForm((current) => ({ ...current, email: current.email.trim().toLowerCase() }));
      setPhase('verification');
      setFeedback({ type: 'success', text: result.message });
    } catch (error) {
      setFeedback({ type: 'error', text: error instanceof Error ? error.message : 'Could not submit application.' });
    } finally {
      setBusy(false);
    }
  };

  const verifyEmail = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setFeedback(null);
    try {
      const response = await fetch('/api/seller/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: form.email.trim(), otp }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || 'Could not verify your email.');
      setPhase('verified');
      setFeedback({ type: 'success', text: result.message });
    } catch (error) {
      setFeedback({ type: 'error', text: error instanceof Error ? error.message : 'Could not verify your email.' });
    } finally {
      setBusy(false);
    }
  };

  const resendCode = async () => {
    setBusy(true);
    setFeedback(null);
    try {
      const response = await fetch('/api/seller/resend-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: form.email.trim() }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || 'Could not resend the verification code.');
      setFeedback({ type: 'success', text: result.message });
    } catch (error) {
      setFeedback({ type: 'error', text: error instanceof Error ? error.message : 'Could not resend the verification code.' });
    } finally {
      setBusy(false);
    }
  };

  const BRAND = '#7A1F3D';
  const stepIndex = phase === 'application' ? 0 : phase === 'verification' ? 1 : 2;

  return (
    <main className="min-h-screen bg-[#faf6f7] px-3 py-6 sm:px-6 sm:py-10">
      <div className="mx-auto grid w-full max-w-5xl overflow-hidden rounded-2xl bg-white shadow-xl md:grid-cols-2">

        {/* ─── Left brand panel ─── */}
        <aside
          className="relative hidden flex-col justify-between overflow-hidden p-8 text-white md:flex"
          style={{ background: `linear-gradient(150deg, ${BRAND} 0%, #9d2b52 55%, #5c152e 100%)` }}
        >
          <div className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-white/10" />
          <div className="absolute -bottom-20 -left-10 h-48 w-48 rounded-full bg-white/5" />

          <div className="relative">
            <Link href="/" className="inline-flex items-center gap-2 text-sm font-bold">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/15 backdrop-blur">
                <Store className="h-4 w-4" />
              </span>
              Veeo Store
            </Link>

            <h2 className="mt-10 text-2xl font-bold leading-tight">
              Turn your network into<br />a steady income.
            </h2>
            <p className="mt-3 max-w-xs text-sm leading-relaxed text-white/75">
              Join Veeo's seller programme. Promote products, track every referral, and earn profit on eligible sales.
            </p>

            <ul className="mt-8 space-y-3 text-sm">
              {[
                { icon: TrendingUp, text: 'Earn commissions on every eligible sale' },
                { icon: Package, text: 'Promote curated Veeo products' },
                { icon: Wallet, text: 'Track earnings in real-time' },
                { icon: Gift, text: 'Unlock monthly gift rewards' },
              ].map(({ icon: Icon, text }) => (
                <li key={text} className="flex items-center gap-2.5 text-white/85">
                  <span className="flex h-6 w-6 items-center justify-center rounded-md bg-white/15">
                    <Icon className="h-3.5 w-3.5" />
                  </span>
                  {text}
                </li>
              ))}
            </ul>
          </div>

          <p className="relative mt-8 text-[11px] text-white/60">
            © {new Date().getFullYear()} Veeo Store · Seller Programme
          </p>
        </aside>

        {/* ─── Right form panel ─── */}
        <section className="flex flex-col p-6 sm:p-8">

          {/* Stepper */}
          <div className="mb-6 flex items-center gap-2">
            {[
              { i: 0, label: 'Apply' },
              { i: 1, label: 'Verify' },
              { i: 2, label: 'Done' },
            ].map(({ i, label }, idx) => {
              const active = stepIndex === i;
              const done = stepIndex > i;
              return (
                <div key={label} className="flex flex-1 items-center gap-2 last:flex-none">
                  <div
                    className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold transition-all ${
                      done ? 'text-white' : active ? 'text-white' : 'border border-gray-200 bg-white text-gray-400'
                    }`}
                    style={{
                      background: done || active
                        ? `linear-gradient(135deg, ${BRAND}, #9d2b52)`
                        : undefined,
                      boxShadow: active ? `0 0 0 3px #7A1F3D22` : undefined,
                    }}
                  >
                    {done ? <CheckCircle2 className="h-3.5 w-3.5" /> : i + 1}
                  </div>
                  <span
                    className={`hidden text-[11px] font-semibold sm:inline ${
                      active ? 'text-gray-900' : done ? 'text-gray-700' : 'text-gray-400'
                    }`}
                  >
                    {label}
                  </span>
                  {idx < 2 && <div className="h-px flex-1 bg-gray-200 sm:ml-2" />}
                </div>
              );
            })}
          </div>

          {/* Heading */}
          <div className="mb-5">
            <h1 className="text-xl font-bold text-gray-900">
              {phase === 'application'
                ? 'Create your seller account'
                : phase === 'verification'
                  ? 'Verify your email'
                  : 'You’re verified!'}
            </h1>
            <p className="mt-1 text-xs leading-relaxed text-gray-500">
              {phase === 'application'
                ? 'A few details and you’re on your way.'
                : phase === 'verification'
                  ? `We sent a 6-digit code to ${form.email}. It expires in 5 minutes.`
                  : 'Your email is confirmed. Continue to see your application status.'}
            </p>
          </div>

          {/* Feedback */}
          {feedback && (
            <div
              role={feedback.type === 'error' ? 'alert' : 'status'}
              className={`mb-4 flex items-start gap-2 rounded-lg border px-3 py-2 text-xs ${
                feedback.type === 'error'
                  ? 'border-red-200 bg-red-50 text-red-700'
                  : 'border-green-200 bg-green-50 text-green-800'
              }`}
            >
              {feedback.type === 'error'
                ? <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                : <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0" />}
              <span>{feedback.text}</span>
            </div>
          )}

          {/* ─── APPLICATION ─── */}
          {phase === 'application' && (
            <form onSubmit={submit} className="space-y-3">
              <Field icon={User} label="Full name">
                <input
                  required
                  maxLength={120}
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Ayesha Khan"
                  className="w-full rounded-lg border border-gray-200 bg-white py-2 pl-9 pr-3 text-sm outline-none transition placeholder:text-gray-400 hover:border-gray-300 focus:border-[#7A1F3D] focus:ring-2 focus:ring-[#7A1F3D]/10"
                />
              </Field>

              <Field icon={Mail} label="Email">
                <input
                  required
                  type="email"
                  autoComplete="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="you@example.com"
                  className="w-full rounded-lg border border-gray-200 bg-white py-2 pl-9 pr-3 text-sm outline-none transition placeholder:text-gray-400 hover:border-gray-300 focus:border-[#7A1F3D] focus:ring-2 focus:ring-[#7A1F3D]/10"
                />
              </Field>

              <Field icon={Phone} label="Phone">
                <input
                  required
                  type="tel"
                  autoComplete="tel"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="+92 300 1234567"
                  className="w-full rounded-lg border border-gray-200 bg-white py-2 pl-9 pr-3 text-sm outline-none transition placeholder:text-gray-400 hover:border-gray-300 focus:border-[#7A1F3D] focus:ring-2 focus:ring-[#7A1F3D]/10"
                />
              </Field>

              <Field icon={Lock} label="Password" hint="At least 10 characters.">
                <input
                  required
                  type={showPassword ? 'text' : 'password'}
                  minLength={10}
                  maxLength={128}
                  autoComplete="new-password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder="••••••••••"
                  className="w-full rounded-lg border border-gray-200 bg-white py-2 pl-9 pr-10 text-sm outline-none transition placeholder:text-gray-400 hover:border-gray-300 focus:border-[#7A1F3D] focus:ring-2 focus:ring-[#7A1F3D]/10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                </button>
              </Field>

              <button
                disabled={busy}
                className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60"
                style={{ background: `linear-gradient(135deg, ${BRAND}, #9d2b52)` }}
              >
                {busy ? 'Submitting…' : (<>Submit application <ArrowRight className="h-4 w-4" /></>)}
              </button>

              <p className="pt-1 text-center text-[11px] leading-relaxed text-gray-500">
                By applying you agree to Veeo’s seller terms. Applications are reviewed by our team.
              </p>
            </form>
          )}

          {/* ─── VERIFICATION ─── */}
          {phase === 'verification' && (
            <form onSubmit={verifyEmail} className="space-y-3">
              <Field icon={KeyRound} label="Six-digit code">
                <input
                  required
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  pattern="[0-9]{6}"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="••••••"
                  className="w-full rounded-lg border border-gray-200 bg-white py-2.5 pl-9 pr-3 text-center text-lg font-semibold tracking-[0.35em] text-gray-900 outline-none transition placeholder:tracking-[0.35em] placeholder:text-gray-300 focus:border-[#7A1F3D] focus:ring-2 focus:ring-[#7A1F3D]/10"
                />
              </Field>

              <button
                disabled={busy || otp.length !== 6}
                className="mt-1 flex w-full items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
                style={{ background: `linear-gradient(135deg, ${BRAND}, #9d2b52)` }}
              >
                {busy ? 'Verifying…' : (<>Verify email <BadgeCheck className="h-4 w-4" /></>)}
              </button>

              <div className="flex items-center justify-between pt-1 text-[11px]">
                <button
                  type="button"
                  disabled={busy}
                  onClick={resendCode}
                  className="inline-flex items-center gap-1 font-semibold disabled:opacity-60"
                  style={{ color: BRAND }}
                >
                  <RefreshCw className="h-3 w-3" /> {busy ? 'Please wait…' : 'Resend code'}
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => { setPhase('application'); setFeedback(null); }}
                  className="inline-flex items-center gap-1 text-gray-500 underline disabled:opacity-60 hover:text-gray-700"
                >
                  <ArrowLeft className="h-3 w-3" /> Change email
                </button>
              </div>
            </form>
          )}

          {/* ─── VERIFIED ─── */}
          {phase === 'verified' && (
            <div className="space-y-4 text-center">
              <div
                className="mx-auto flex h-16 w-16 items-center justify-center rounded-full shadow-sm"
                style={{ background: `linear-gradient(135deg, ${BRAND}, #9d2b52)` }}
              >
                <Sparkles className="h-7 w-7 text-white" />
              </div>
              <p className="text-xs leading-relaxed text-gray-500">
                Welcome aboard! Your seller portal is ready.
              </p>
              <button
                type="button"
                onClick={() => router.replace('/seller')}
                className="flex w-full items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                style={{ background: `linear-gradient(135deg, ${BRAND}, #9d2b52)` }}
              >
                Continue to seller portal <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          )}

          {/* Footer link */}
          <p className="mt-6 text-center text-[11px] text-gray-500">
            Already applied?{' '}
            <Link href="/seller/login" className="font-semibold hover:underline" style={{ color: BRAND }}>
              Sign in
            </Link>
          </p>
        </section>
      </div>
    </main>
  );
}

/* ─── Reusable compact field with leading icon ─── */
function Field({
  icon: Icon,
  label,
  hint,
  children,
}: {
  icon: any;
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-gray-600">
        {label}
      </span>
      <div className="relative">
        <Icon className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
        {children}
      </div>
      {hint && <span className="mt-1 block text-[10px] text-gray-400">{hint}</span>}
    </label>
  );
}