import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAdmin } from '../hooks/useAdmin';
import { SEO } from '../components/seo/SEO';
import { InlineAlert } from '../components/feedback/InlineAlert';
import { Button } from '../components/ui/Button';
import { toUserMessage } from '../utils/errors';

export default function AdminLoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, emailPasswordLoginMutation } = useAdmin({ minimal: true });

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const target = useMemo(() => {
    const state = location.state as { from?: string } | null;
    return state?.from || '/admin';
  }, [location.state]);

  useEffect(() => {
    if (isAuthenticated && !emailPasswordLoginMutation.isError) {
      navigate(target, { replace: true });
    }
  }, [isAuthenticated, emailPasswordLoginMutation.isError, navigate, target]);

  function validateForm(): boolean {
    const newErrors: Record<string, string> = {};
    
    if (!email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!email.includes('@')) {
      newErrors.email = 'Please enter a valid email';
    }

    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    emailPasswordLoginMutation.mutate({ email: email.trim().toLowerCase(), password });
  }

  return (
    <>
      <SEO title="Admin Login" description="YS Store Administrator Login" noindex={true} />
      <div className="mx-auto max-w-lg space-y-5 pb-8 pt-6">
        <header className="space-y-2 text-center">
          <p className="text-[12px] font-medium tracking-[0.18em] text-secondary">YS STORE</p>
          <h1 className="text-[34px] font-semibold tracking-[-0.03em] text-foreground">Admin Login</h1>
          <p className="text-sm text-secondary">Sign in with your authorized admin credentials.</p>
        </header>

        <section className="rounded-2xl border border-border bg-surface p-5 shadow-soft">
          <form onSubmit={handleSubmit} className="space-y-4">
            {emailPasswordLoginMutation.isError ? (
              <InlineAlert 
                tone="error" 
                message={toUserMessage(emailPasswordLoginMutation.error, 'Admin login failed. Please check your credentials.')} 
              />
            ) : null}

            <div className="space-y-1">
              <label htmlFor="email" className="block text-sm font-medium text-foreground">
                Email
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (errors.email) setErrors({ ...errors, email: '' });
                }}
                placeholder="admin@example.com"
                disabled={emailPasswordLoginMutation.isPending}
                className="w-full rounded-[2px] border border-border bg-inputBg px-3 py-2 text-sm text-foreground placeholder-muted focus:border-accent focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
              />
              {errors.email && <p className="text-xs text-error">{errors.email}</p>}
            </div>

            <div className="space-y-1">
              <label htmlFor="password" className="block text-sm font-medium text-foreground">
                Password
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (errors.password) setErrors({ ...errors, password: '' });
                }}
                placeholder="••••••••"
                disabled={emailPasswordLoginMutation.isPending}
                className="w-full rounded-[2px] border border-border bg-inputBg px-3 py-2 text-sm text-foreground placeholder-muted focus:border-accent focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
              />
              {errors.password && <p className="text-xs text-error">{errors.password}</p>}
            </div>

            <Button
              type="submit"
              size="lg"
              fullWidth
              loading={emailPasswordLoginMutation.isPending}
              disabled={emailPasswordLoginMutation.isPending}
            >
              Sign In
            </Button>
          </form>

          <p className="mt-4 text-center text-[12px] text-secondary">
            Only authorized administrators can access this area.
          </p>
        </section>

        <p className="text-center text-[13px] text-secondary">
          Looking for customer login? <Link to="/login" className="font-semibold text-foreground hover:text-accent">Open customer login</Link>.
        </p>
      </div>
    </>
  );
}
