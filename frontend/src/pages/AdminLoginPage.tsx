import { useEffect, useMemo } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAdmin } from '../hooks/useAdmin';
import { SEO } from '../components/seo/SEO';
import { InlineAlert } from '../components/feedback/InlineAlert';
import { Button } from '../components/ui/Button';
import { toUserMessage } from '../utils/errors';

export default function AdminLoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, googleAdminLoginMutation } = useAdmin();

  const target = useMemo(() => {
    const state = location.state as { from?: string } | null;
    return state?.from || '/admin';
  }, [location.state]);

  useEffect(() => {
    if (isAuthenticated) {
      navigate(target, { replace: true });
    }
  }, [isAuthenticated, navigate, target]);

  return (
    <>
      <SEO title="Admin Login" description="YS Store Administrator Login" noindex={true} />
      <div className="mx-auto max-w-lg space-y-5 pb-8 pt-6">
        <header className="space-y-2 text-center">
        <p className="text-[12px] font-medium tracking-[0.18em] text-secondary">YS STORE</p>
        <h1 className="text-[34px] font-semibold tracking-[-0.03em] text-foreground">Admin Login</h1>
        <p className="text-sm text-secondary">Sign in securely with authorized Google credentials.</p>
      </header>

      <section className="rounded-2xl border border-border bg-surface p-5 shadow-soft">
        <div className="space-y-4">
          {googleAdminLoginMutation.isError ? (
            <InlineAlert tone="error" message={toUserMessage(googleAdminLoginMutation.error, 'Admin login failed')} />
          ) : null}

          <Button
            type="button"
            size="lg"
            fullWidth
            loading={googleAdminLoginMutation.isPending}
            disabled={googleAdminLoginMutation.isPending}
            onClick={() => googleAdminLoginMutation.mutate(target)}
          >
            Continue with Google (Admin)
          </Button>

          <p className="text-center text-[12px] text-secondary">Email and password login is disabled for administrators.</p>
        </div>

        <p className="mt-4 text-center text-[13px] text-secondary">
          Looking for customer login? <Link to="/login" className="font-semibold text-foreground hover:text-accent">Open customer login</Link>.
        </p>
      </section>
    </div>
    </>
  );
}
