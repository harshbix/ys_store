import { FormEvent, useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { InlineAlert } from '../components/feedback/InlineAlert';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { useAuth } from '../hooks/useAuth';
import { toUserMessage } from '../utils/errors';

type LocationState = {
  returnTo?: string;
};

function normalizeOptionalUrl(value: string | undefined): string | null {
  const normalized = (value || '').trim();
  return normalized.length > 0 ? normalized : null;
}

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, loginMutation } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const returnTo = (location.state as LocationState | null)?.returnTo;
  const googleAuthUrl = normalizeOptionalUrl(import.meta.env.VITE_GOOGLE_AUTH_URL);

  useEffect(() => {
    if (!isAuthenticated) return;
    navigate(returnTo || '/shop', { replace: true });
  }, [isAuthenticated, navigate, returnTo]);

  const canSubmit = useMemo(() => /.+@.+\..+/.test(email.trim()) && password.trim().length >= 6, [email, password]);

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canSubmit || loginMutation.isPending) return;

    loginMutation.mutate({
      inputEmail: email.trim(),
      password: password.trim()
    });
  };

  return (
    <div className="mx-auto max-w-md space-y-6 pb-10 pt-2">
      <header className="space-y-2 text-center">
        <p className="text-[12px] font-medium tracking-[0.18em] text-secondary">YS STORE</p>
        <h1 className="text-[34px] font-semibold tracking-[-0.03em] text-foreground">Sign in</h1>
        <p className="text-sm text-secondary">Welcome back. Continue where you left off.</p>
      </header>

      <section className="rounded-2xl border border-border bg-surface p-5 shadow-soft">
        <form className="space-y-4" onSubmit={onSubmit}>
          <Input
            id="email-input"
            label="Email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@example.com"
            autoComplete="email"
          />

          <label className="block space-y-1.5">
            <span className="label-11 text-secondary">Password</span>
            <div className="relative">
              <input
                id="password-input"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Enter your password"
                autoComplete="current-password"
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
          </label>

          {loginMutation.isError ? (
            <InlineAlert tone="error" message={toUserMessage(loginMutation.error, 'Login failed. Check your email or password.')} />
          ) : null}

          <Button type="submit" size="lg" fullWidth loading={loginMutation.isPending} disabled={!canSubmit || loginMutation.isPending}>
            Sign In
          </Button>
        </form>

        {googleAuthUrl ? (
          <div className="mt-4 border-t border-border pt-4">
            <button
              type="button"
              onClick={() => window.location.assign(googleAuthUrl)}
              className="inline-flex min-h-11 w-full items-center justify-center rounded-[2px] border border-border bg-background px-4 text-sm font-medium text-foreground transition hover:bg-surfaceHover"
            >
              Continue with Google
            </button>
          </div>
        ) : null}

        <p className="mt-4 text-center text-sm text-secondary">
          No account yet? <Link to="/register" className="font-semibold text-foreground hover:text-accent">Create account</Link>
        </p>
      </section>
    </div>
  );
}
