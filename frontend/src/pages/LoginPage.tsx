import { FormEvent, useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { OtpCodeInput } from '../components/auth/OtpCodeInput';
import { AuthPromptBanner } from '../components/ui/AuthPromptBanner';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { InlineAlert } from '../components/feedback/InlineAlert';
import { useAuth } from '../hooks/useAuth';

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, customerId, email, challengeId, requestOtpMutation, verifyOtpMutation, logout } = useAuth();

  const [emailInput, setEmailInput] = useState(email || '');
  const [codeInput, setCodeInput] = useState('');
  const [resendCountdown, setResendCountdown] = useState(0);
  const returnTo = (location.state as { returnTo?: string } | null)?.returnTo;
  const googleAuthUrl = (import.meta.env.VITE_GOOGLE_AUTH_URL as string | undefined)?.trim();
  const appleAuthUrl = (import.meta.env.VITE_APPLE_AUTH_URL as string | undefined)?.trim();

  useEffect(() => {
    if (!email && emailInput) return;
    if (email) setEmailInput(email);
  }, [email, emailInput]);

  useEffect(() => {
    if (resendCountdown <= 0) return;
    const timer = window.setTimeout(() => {
      setResendCountdown((previous) => Math.max(0, previous - 1));
    }, 1000);

    return () => window.clearTimeout(timer);
  }, [resendCountdown]);

  useEffect(() => {
    if (!isAuthenticated) return;
    if (returnTo) {
      navigate(returnTo, { replace: true });
    }
  }, [isAuthenticated, navigate, returnTo]);

  const canRequestOtp = useMemo(() => /.+@.+\..+/.test(emailInput.trim()), [emailInput]);
  const canResend = resendCountdown === 0 && !requestOtpMutation.isPending;

  const onRequestOtp = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canRequestOtp) return;
    requestOtpMutation.mutate(emailInput.trim(), {
      onSuccess: () => setResendCountdown(30)
    });
  };

  const onVerifyOtp = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!challengeId || codeInput.trim().length < 4) return;
    verifyOtpMutation.mutate({ inputEmail: emailInput.trim(), code: codeInput.trim() });
  };

  const onResend = () => {
    if (!canRequestOtp || !canResend) return;
    requestOtpMutation.mutate(emailInput.trim(), {
      onSuccess: () => setResendCountdown(30)
    });
  };

  return (
    <div className="mx-auto max-w-2xl space-y-5 pb-8">
      <header>
        <h1 className="section-title text-foreground">Customer Login</h1>
        <p className="mt-2 text-[13px] text-secondary">Sign in with your email to sync wishlist, quote activity, and your saved cart.</p>
      </header>

      <AuthPromptBanner />

      {isAuthenticated ? (
        <section className="rounded-2xl border border-border bg-surface p-5">
          <h2 className="text-base font-semibold text-foreground">You are signed in</h2>
          <p className="mt-2 text-sm text-muted">Email: {email || 'Verified account'}</p>
          {customerId ? <p className="text-xs text-muted">Account linked successfully.</p> : null}
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
          <ol className="mb-4 grid gap-2 rounded-xl border border-border bg-background p-3 text-xs text-muted sm:grid-cols-3">
            <li className="inline-flex items-center gap-2"><span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[11px] font-semibold text-primaryForeground">1</span> Enter email</li>
            <li className="inline-flex items-center gap-2"><span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[11px] font-semibold text-primaryForeground">2</span> Receive OTP</li>
            <li className="inline-flex items-center gap-2"><span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[11px] font-semibold text-primaryForeground">3</span> Verify code</li>
          </ol>

          <form onSubmit={onRequestOtp} className="space-y-3">
            <Input
              id="email-input"
              label="Email Address"
              type="email"
              value={emailInput}
              onChange={(event) => setEmailInput(event.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
              hint="We will send a one-time passcode to this email."
            />
            <Button
              type="submit"
              loading={requestOtpMutation.isPending}
              disabled={!canRequestOtp || requestOtpMutation.isPending}
            >
              {challengeId ? 'Send New Code' : 'Send Verification Code'}
            </Button>

            {requestOtpMutation.isError ? (
              <InlineAlert message="We could not send your email code right now. Please try again." tone="error" />
            ) : null}
          </form>

          <form onSubmit={onVerifyOtp} className="mt-5 space-y-3 border-t border-border pt-4">
            <p className="label-11 text-secondary">Enter Verification Code</p>
            <OtpCodeInput
              value={codeInput}
              onChange={setCodeInput}
              disabled={verifyOtpMutation.isPending}
            />
            <Button
              type="submit"
              variant="secondary"
              loading={verifyOtpMutation.isPending}
              disabled={!challengeId || codeInput.trim().length < 4 || verifyOtpMutation.isPending}
            >
              Verify and Continue
            </Button>

            <div className="flex flex-wrap items-center gap-2 text-xs text-muted">
              <span>Didn&apos;t receive the code?</span>
              <button
                type="button"
                onClick={onResend}
                disabled={!canResend || !canRequestOtp}
                className="font-semibold text-foreground disabled:opacity-40"
              >
                {resendCountdown > 0 ? `Resend in ${resendCountdown}s` : 'Resend code'}
              </button>
            </div>

            {verifyOtpMutation.isError ? (
              <InlineAlert message="That code was invalid or expired. Request a new one and try again." tone="error" />
            ) : null}
          </form>

          {googleAuthUrl || appleAuthUrl ? (
            <div className="mt-5 space-y-2 border-t border-border pt-4">
              <p className="label-11 text-secondary">Other Sign-In Options</p>
              <div className="flex flex-wrap gap-2">
                {googleAuthUrl ? (
                  <Button variant="ghost" onClick={() => window.location.assign(googleAuthUrl)}>
                    Continue with Google
                  </Button>
                ) : null}
                {appleAuthUrl ? (
                  <Button variant="ghost" onClick={() => window.location.assign(appleAuthUrl)}>
                    Continue with Apple
                  </Button>
                ) : null}
              </div>
            </div>
          ) : null}
        </section>
      )}

      <section className="rounded-2xl border border-border bg-background p-4 text-sm text-muted">
        Need administrator access? <Link to="/admin/login" className="font-semibold text-foreground hover:text-accent">Open admin login</Link>.
      </section>
    </div>
  );
}
