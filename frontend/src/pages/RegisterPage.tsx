import { FormEvent, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { InlineAlert } from '../components/feedback/InlineAlert';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { useAuth } from '../hooks/useAuth';
import { normalizeApiError } from '../lib/errors';
import { toUserMessage } from '../utils/errors';

function normalizeOptionalUrl(value: string | undefined): string | null {
  const normalized = (value || '').trim();
  return normalized.length > 0 ? normalized : null;
}

export default function RegisterPage() {
  const navigate = useNavigate();
  const { isAuthenticated, registerMutation } = useAuth();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [cooldownUntil, setCooldownUntil] = useState<number | null>(null);
  const [nowTs, setNowTs] = useState(Date.now());

  const googleAuthUrl = normalizeOptionalUrl(import.meta.env.VITE_GOOGLE_AUTH_URL);

  useEffect(() => {
    if (!isAuthenticated) return;
    navigate('/shop', { replace: true });
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    if (!registerMutation.isSuccess) return;
    if (!registerMutation.data?.requires_email_verification) return;

    navigate('/login', {
      replace: true,
      state: {
        returnTo: '/shop'
      }
    });
  }, [navigate, registerMutation.data, registerMutation.isSuccess]);

  useEffect(() => {
    if (!registerMutation.isError) return;
    const normalized = normalizeApiError(registerMutation.error);
    const rateLimited = normalized.status === 429
      && (normalized.code === 'over_email_send_rate_limit' || normalized.code === 'register_failed');
    if (!rateLimited) return;
    setCooldownUntil(Date.now() + 15000);
  }, [registerMutation.error, registerMutation.isError]);

  useEffect(() => {
    if (!cooldownUntil) return;
    const timer = window.setInterval(() => setNowTs(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [cooldownUntil]);

  const emailValid = /.+@.+\..+/.test(email.trim());
  const passwordValid = password.trim().length >= 6;
  const passwordsMatch = password === confirmPassword;

  const canSubmit = useMemo(() => {
    return fullName.trim().length >= 2 && emailValid && passwordValid && passwordsMatch;
  }, [fullName, emailValid, passwordValid, passwordsMatch]);

  const cooldownRemaining = cooldownUntil ? Math.max(0, Math.ceil((cooldownUntil - nowTs) / 1000)) : 0;
  const isCoolingDown = cooldownRemaining > 0;

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canSubmit || registerMutation.isPending || isCoolingDown) return;

    registerMutation.mutate({
      fullName: fullName.trim(),
      inputEmail: email.trim(),
      password: password.trim()
    });
  };

  return (
    <div className="mx-auto max-w-md space-y-6 pb-10 pt-2">
      <header className="space-y-2 text-center">
        <p className="text-[12px] font-medium tracking-[0.18em] text-secondary">YS STORE</p>
        <h1 className="text-[34px] font-semibold tracking-[-0.03em] text-foreground">Create account</h1>
        <p className="text-sm text-secondary">Join once, shop faster next time.</p>
      </header>

      <section className="rounded-2xl border border-border bg-surface p-5 shadow-soft">
        <form className="space-y-4" onSubmit={onSubmit}>
          <Input
            id="full-name-input"
            label="Full name"
            type="text"
            value={fullName}
            onChange={(event) => setFullName(event.target.value)}
            placeholder="Your name"
            error={fullName.length > 0 && fullName.trim().length < 2 ? 'Please enter at least 2 characters.' : undefined}
          />

          <Input
            id="register-email-input"
            label="Email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@example.com"
            autoComplete="email"
            error={email.length > 0 && !emailValid ? 'Please enter a valid email address.' : undefined}
          />

          <label className="block space-y-1.5">
            <span className="label-11 text-secondary">Password</span>
            <div className="relative">
              <input
                id="register-password-input"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="At least 6 characters"
                autoComplete="new-password"
                className="h-10 w-full rounded-[2px] border border-border bg-inputBg px-3 pr-11 text-[13px] text-foreground placeholder:text-muted transition focus-visible:border-ring focus-visible:outline-none"
              />
              <button
                type="button"
                onClick={() => setShowPassword((previous) => !previous)}
                className="absolute right-1 top-1 inline-flex h-8 w-8 items-center justify-center text-secondary transition hover:text-foreground"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {password.length > 0 && !passwordValid ? <p className="text-[12px] text-danger">Password must be at least 6 characters.</p> : null}
          </label>

          <label className="block space-y-1.5">
            <span className="label-11 text-secondary">Confirm password</span>
            <div className="relative">
              <input
                id="confirm-password-input"
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                placeholder="Repeat your password"
                autoComplete="new-password"
                className="h-10 w-full rounded-[2px] border border-border bg-inputBg px-3 pr-11 text-[13px] text-foreground placeholder:text-muted transition focus-visible:border-ring focus-visible:outline-none"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword((previous) => !previous)}
                className="absolute right-1 top-1 inline-flex h-8 w-8 items-center justify-center text-secondary transition hover:text-foreground"
                aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
              >
                {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {confirmPassword.length > 0 && !passwordsMatch ? <p className="text-[12px] text-danger">Passwords do not match.</p> : null}
          </label>

          {registerMutation.isError ? (
            <InlineAlert
              tone="error"
              message={toUserMessage(registerMutation.error, 'Could not create account. Please try another email.')}
            />
          ) : null}

          {isCoolingDown ? (
            <p className="text-[12px] text-secondary">
              Please wait {cooldownRemaining}s before trying again, or sign in if your account already exists.
            </p>
          ) : null}

          <Button type="submit" size="lg" fullWidth loading={registerMutation.isPending} disabled={!canSubmit || registerMutation.isPending || isCoolingDown}>
            Create Account
          </Button>
        </form>

        {googleAuthUrl ? (
          <div className="mt-4 border-t border-border pt-4">
            <button
              type="button"
              onClick={() => window.location.assign(googleAuthUrl)}
              className="inline-flex min-h-11 w-full items-center justify-center rounded-[2px] border border-border bg-background px-4 text-sm font-medium text-foreground transition hover:bg-surfaceHover"
            >
              Sign up with Google
            </button>
          </div>
        ) : null}

        <p className="mt-4 text-center text-sm text-secondary">
          Already have an account? <Link to="/login" className="font-semibold text-foreground hover:text-accent">Sign in</Link>
        </p>
      </section>
    </div>
  );
}
