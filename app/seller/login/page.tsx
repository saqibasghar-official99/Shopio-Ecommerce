'use client';

import { FormEvent, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Store, Mail, Lock, Eye, EyeOff, ShieldCheck, CheckCircle2,
  ArrowRight, AlertCircle, BadgeCheck
} from 'lucide-react';

export default function SellerLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [applicationSubmitted, setApplicationSubmitted] = useState(false);
  const [verificationRequired, setVerificationRequired] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [forgotPassword, setForgotPassword] = useState(false);
  const [resetCodeSent, setResetCodeSent] = useState(false);
  const [resetOtp, setResetOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [notice, setNotice] = useState('');

  useEffect(() => {
    setApplicationSubmitted(new URLSearchParams(window.location.search).get('applied') === '1');
  }, []);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setMessage('');
    setNotice('');
    try {
      if (forgotPassword && resetCodeSent) {
        const response = await fetch('/api/seller/reset-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, otp: resetOtp, password: newPassword }),
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.message || 'Could not reset your password.');
        setForgotPassword(false);
        setResetCodeSent(false);
        setResetOtp('');
        setNewPassword('');
        setPassword('');
        setNotice(result.message);
        return;
      }

      const response = await fetch('/api/seller/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const result = await response.json();
      if (!response.ok) {
        setVerificationRequired(result.verificationRequired === true);
        throw new Error(result.message || 'Could not sign in.');
      }
      router.replace('/seller');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not sign in.');
    } finally {
      setBusy(false);
    }
  };

  const requestPasswordReset = async () => {
    setBusy(true);
    setMessage('');
    setNotice('');
    try {
      const response = await fetch('/api/seller/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || 'Could not request a password reset.');
      setResetCodeSent(true);
      setNotice(result.message);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not request a password reset.');
    } finally {
      setBusy(false);
    }
  };

  const cancelPasswordReset = () => {
    setForgotPassword(false);
    setResetCodeSent(false);
    setResetOtp('');
    setNewPassword('');
    setMessage('');
    setNotice('');
  };

  const BRAND = '#7A1F3D';

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#faf6f7] px-4 py-10">
      {/* Soft ambient brand glows */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-32 -right-32 h-96 w-96 rounded-full opacity-40 blur-3xl"
        style={{ background: `radial-gradient(circle, ${BRAND}33, transparent 70%)` }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-40 -left-32 h-96 w-96 rounded-full opacity-30 blur-3xl"
        style={{ background: `radial-gradient(circle, ${BRAND}26, transparent 70%)` }}
      />

      <form
        onSubmit={submit}
        className="relative w-full max-w-sm overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-xl"
      >
        {/* Gradient top accent */}
        <div
          className="h-1.5 w-full"
          style={{ background: `linear-gradient(90deg, ${BRAND}, #b83a63, #9d2b52)` }}
        />

        <div className="p-7">
          {/* Brand + logo */}
          <div className="flex flex-col items-center text-center">
            <Link
              href="/"
              className="flex h-12 w-12 items-center justify-center rounded-2xl text-white shadow-md transition hover:-translate-y-0.5 hover:shadow-lg"
              style={{ background: `linear-gradient(135deg, ${BRAND}, #9d2b52)` }}
              aria-label="Veeo Store home"
            >
              <Store className="h-5 w-5" />
            </Link>
            <h1 className="mt-1 text-xl font-bold text-gray-900">
              {forgotPassword ? (resetCodeSent ? 'Choose a new password' : 'Reset your password') : 'Welcome back'}
            </h1>
            <p className="mt-1 text-xs text-gray-500">
              {forgotPassword
                ? resetCodeSent
                  ? `Enter the code sent to ${email}. It expires in five minutes.`
                  : 'Enter your seller email and we will send a reset code if the account is eligible.'
                : 'Sign in to your seller account to continue.'}
            </p>
          </div>

          {/* Application received banner */}
          {applicationSubmitted && (
            <div
              role="status"
              className="mt-5 flex items-start gap-2 rounded-lg border border-green-200 bg-green-50 px-3 py-2.5 text-[11px] leading-relaxed text-green-800"
            >
              <BadgeCheck className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              <span>
                Application received. Verify your email before signing in; seller tools become available automatically within two minutes of registration.
              </span>
            </div>
          )}

          {/* Error */}
          {message && (
            <div
              role="alert"
              className="mt-4 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-[11px] leading-relaxed text-red-700"
            >
              <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              <span>{message}</span>
            </div>
          )}

          {notice && (
            <div
              role="status"
              className="mt-4 rounded-lg border border-green-200 bg-green-50 px-3 py-2.5 text-[11px] leading-relaxed text-green-800"
            >
              {notice}
            </div>
          )}

          {/* Verification resend link */}
          {verificationRequired && (
            <div className="mt-3 flex items-start gap-2 rounded-lg border px-3 py-2.5 text-[11px]" style={{ borderColor: '#7A1F3D26', backgroundColor: '#7A1F3D08' }}>
              <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0" style={{ color: BRAND }} />
              <Link
                href={`/seller/register?verify=1&email=${encodeURIComponent(email.trim())}`}
                className="font-semibold underline"
                style={{ color: BRAND }}
              >
                Resend an email verification code
              </Link>
            </div>
          )}

          {/* Fields */}
          <div className="mt-5 space-y-3">
            <label className="block">
              <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-gray-600">
                Email
              </span>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
                <input
                  required
                  type="email"
                  autoComplete="email"
                  readOnly={forgotPassword && resetCodeSent}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full rounded-lg border border-gray-200 bg-white py-2 pl-9 pr-3 text-sm outline-none transition placeholder:text-gray-400 hover:border-gray-300 focus:border-[#7A1F3D] focus:ring-2 focus:ring-[#7A1F3D]/10"
                />
              </div>
            </label>

            {!forgotPassword && <label className="block">
              <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-gray-600">
                Password
              </span>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
                <input
                  required
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
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
              </div>
            </label>}

            {forgotPassword && resetCodeSent && <>
              <label className="block">
                <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-gray-600">
                  Six-digit reset code
                </span>
                <input
                  required
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  pattern="[0-9]{6}"
                  maxLength={6}
                  value={resetOtp}
                  onChange={(event) => setResetOtp(event.target.value.replace(/\D/g, '').slice(0, 6))}
                  className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-center text-sm tracking-[0.35em] outline-none focus:border-[#7A1F3D]"
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-gray-600">
                  New password
                </span>
                <input
                  required
                  type="password"
                  autoComplete="new-password"
                  minLength={10}
                  maxLength={128}
                  value={newPassword}
                  onChange={(event) => setNewPassword(event.target.value)}
                  className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-[#7A1F3D]"
                />
                <span className="mt-1 block text-[10px] text-gray-500">Use at least 10 characters.</span>
              </label>
            </>}
          </div>

          {/* Submit */}
          {!forgotPassword && <button
            disabled={busy}
            className="mt-5 flex w-full items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
            style={{ background: `linear-gradient(135deg, ${BRAND}, #9d2b52)` }}
          >
            {busy ? (
              <>
                <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                Signing in…
              </>
            ) : (
              <>
                Sign in <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>}

          {forgotPassword && !resetCodeSent && (
            <button
              type="button"
              disabled={busy || !email.trim()}
              onClick={requestPasswordReset}
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-60"
              style={{ background: `linear-gradient(135deg, ${BRAND}, #9d2b52)` }}
            >
              {busy ? 'Sending code…' : 'Send reset code'}
            </button>
          )}

          {forgotPassword && resetCodeSent && (
            <>
              <button
                type="submit"
                disabled={busy || resetOtp.length !== 6 || newPassword.length < 10}
                className="mt-5 flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-60"
                style={{ background: `linear-gradient(135deg, ${BRAND}, #9d2b52)` }}
              >
                {busy ? 'Resetting password…' : 'Reset password'}
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={requestPasswordReset}
                className="mt-3 w-full text-center text-[11px] font-medium underline disabled:opacity-60"
                style={{ color: BRAND }}
              >
                Send another reset code
              </button>
            </>
          )}

          <div className="mt-3 text-center">
            {forgotPassword ? (
              <button type="button" onClick={cancelPasswordReset} className="text-[11px] font-medium text-gray-600 underline">
                Return to sign in
              </button>
            ) : (
              <button
                type="button"
                onClick={() => { setForgotPassword(true); setMessage(''); setNotice(''); }}
                className="text-[11px] font-medium text-gray-600 underline hover:text-gray-800"
              >
                Forgot password?
              </button>
            )}
          </div>

          {/* Divider */}
          <div className="my-5 flex items-center gap-3">
            <div className="h-px flex-1 bg-gray-200" />
            <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">New here?</span>
            <div className="h-px flex-1 bg-gray-200" />
          </div>

          {/* Apply CTA */}
          <Link
            href="/seller/register"
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm font-semibold text-gray-800 transition hover:border-[#7A1F3D]/30 hover:bg-[#7A1F3D]/5"
          >
            <CheckCircle2 className="h-4 w-4" style={{ color: BRAND }} />
            Apply to become a seller
          </Link>

          {/* Support */}
          <p className="mt-4 text-center text-[10px] text-gray-400">
            Reset codes expire in five minutes and can only be used once.
          </p>
        </div>
      </form>
    </main>
  );
}