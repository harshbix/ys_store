import { motion } from 'framer-motion';
import { FormEvent, useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAdmin } from '../hooks/useAdmin';

export default function AdminLoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, loginMutation } = useAdmin();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const target = useMemo(() => {
    const state = location.state as { from?: string } | null;
    return state?.from || '/admin';
  }, [location.state]);

  useEffect(() => {
    if (isAuthenticated) {
      navigate(target, { replace: true });
    }
  }, [isAuthenticated, navigate, target]);

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!email.trim() || !password.trim()) return;
    loginMutation.mutate({ email: email.trim(), password: password.trim() });
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mx-auto max-w-lg space-y-5 pb-8">
      <header>
        <h1 className="font-display text-2xl font-semibold text-foreground">Admin Login</h1>
        <p className="mt-1 text-sm text-muted">Sign in with backend-configured administrator credentials.</p>
      </header>

      <section className="rounded-2xl border border-border bg-surface p-5">
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-foreground" htmlFor="admin-email">
              Email
            </label>
            <input
              id="admin-email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="email"
              className="min-h-11 w-full rounded-xl border border-border bg-background px-3 text-sm text-foreground outline-none ring-0 placeholder:text-muted focus:border-accent"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-foreground" htmlFor="admin-password">
              Password
            </label>
            <input
              id="admin-password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="current-password"
              className="min-h-11 w-full rounded-xl border border-border bg-background px-3 text-sm text-foreground outline-none ring-0 placeholder:text-muted focus:border-accent"
            />
          </div>

          <button
            type="submit"
            disabled={loginMutation.isPending}
            className="min-h-11 rounded-full bg-primary px-5 text-sm font-semibold text-primaryForeground disabled:opacity-50"
          >
            {loginMutation.isPending ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
      </section>

      <section className="rounded-2xl border border-border bg-background p-4 text-sm text-muted">
        Looking for customer login? <Link to="/login" className="font-semibold text-foreground hover:text-accent">Open customer login</Link>.
      </section>
    </motion.div>
  );
}
