import { FormEvent, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { AuthPromptBanner } from '../components/ui/AuthPromptBanner';
import { useAuth } from '../hooks/useAuth';

export default function LoginPage() {
  const { isAuthenticated, customerId, phone, challengeId, requestOtpMutation, verifyOtpMutation, logout } = useAuth();

  const [phoneInput, setPhoneInput] = useState(phone || '');
  const [codeInput, setCodeInput] = useState('');

  useEffect(() => {
    if (!phone && phoneInput) return;
    if (phone) setPhoneInput(phone);
  }, [phone, phoneInput]);

  const canRequestOtp = useMemo(() => phoneInput.trim().length >= 10, [phoneInput]);

  const onRequestOtp = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canRequestOtp) return;
    requestOtpMutation.mutate(phoneInput.trim());
  };

  const onVerifyOtp = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!challengeId || codeInput.trim().length < 4) return;
    verifyOtpMutation.mutate({ inputPhone: phoneInput.trim(), code: codeInput.trim() });
  };

  return (
    <div className="mx-auto max-w-2xl space-y-5 pb-8">
      <header>
        <h1 className="section-title text-foreground">Customer Login</h1>
        <p className="mt-2 text-[13px] text-secondary">Verify your phone via OTP to access account wishlist and persistent cart sync.</p>
      </header>

      <AuthPromptBanner />

      {isAuthenticated ? (
        <section className="rounded-2xl border border-border bg-surface p-5">
          <h2 className="text-base font-semibold text-foreground">You are signed in</h2>
          <p className="mt-2 text-sm text-muted">Customer ID: {customerId}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link to="/wishlist" className="inline-flex min-h-11 items-center rounded-full bg-primary px-5 text-sm font-semibold text-primaryForeground">
              Open Wishlist
            </Link>
            <button
              type="button"
              onClick={logout}
              className="inline-flex min-h-11 items-center rounded-full border border-border px-5 text-sm font-semibold text-foreground"
            >
              Sign Out
            </button>
          </div>
        </section>
      ) : (
        <section className="rounded-2xl border border-border bg-surface p-5">
          <form onSubmit={onRequestOtp} className="space-y-3">
            <label className="block text-sm font-medium text-foreground" htmlFor="phone-input">
              Phone number
            </label>
            <input
              id="phone-input"
              value={phoneInput}
              onChange={(event) => setPhoneInput(event.target.value)}
              placeholder="2557XXXXXXXX"
              autoComplete="tel"
              className="min-h-11 w-full rounded-xl border border-border bg-background px-3 text-sm text-foreground outline-none ring-0 placeholder:text-muted focus:border-accent"
            />
            <button
              type="submit"
              disabled={!canRequestOtp || requestOtpMutation.isPending}
              className="min-h-11 rounded-full bg-primary px-5 text-sm font-semibold text-primaryForeground disabled:opacity-50"
            >
              {requestOtpMutation.isPending ? 'Requesting OTP...' : 'Request OTP'}
            </button>
          </form>

          <form onSubmit={onVerifyOtp} className="mt-5 space-y-3 border-t border-border pt-4">
            <label className="block text-sm font-medium text-foreground" htmlFor="code-input">
              Verification code
            </label>
            <input
              id="code-input"
              value={codeInput}
              onChange={(event) => setCodeInput(event.target.value)}
              placeholder="Enter OTP"
              inputMode="numeric"
              className="min-h-11 w-full rounded-xl border border-border bg-background px-3 text-sm text-foreground outline-none ring-0 placeholder:text-muted focus:border-accent"
            />
            <button
              type="submit"
              disabled={!challengeId || codeInput.trim().length < 4 || verifyOtpMutation.isPending}
              className="min-h-11 rounded-full border border-border px-5 text-sm font-semibold text-foreground disabled:opacity-50"
            >
              {verifyOtpMutation.isPending ? 'Verifying...' : 'Verify OTP'}
            </button>

            <p className="text-xs text-muted">
              OTP delivery depends on backend auth provider setup. If SMS is unavailable in local development, keep shopping as guest.
            </p>
          </form>
        </section>
      )}

      <section className="rounded-2xl border border-border bg-background p-4 text-sm text-muted">
        Need administrator access? <Link to="/admin/login" className="font-semibold text-foreground hover:text-accent">Open admin login</Link>.
      </section>
    </div>
  );
}
