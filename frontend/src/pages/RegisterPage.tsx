import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { SEO } from '../components/seo/SEO';
import { InlineAlert } from '../components/feedback/InlineAlert';
import { Button } from '../components/ui/Button';
import { useAuth } from '../hooks/useAuth';
import { toUserMessage } from '../utils/errors';

export default function RegisterPage() {
  const navigate = useNavigate();
  const { isAuthenticated, googleLoginMutation } = useAuth();

  useEffect(() => {
    if (!isAuthenticated) return;
    navigate('/shop', { replace: true });
  }, [isAuthenticated, navigate]);

  return (
    <>
      <SEO title="Create Account" description="Create your YS Store account to check out fast, save quotes, and more." noindex={true} />
      <div className="mx-auto max-w-md space-y-6 pb-10 pt-2">
        <header className="space-y-2 text-center">
        <p className="text-[12px] font-medium tracking-[0.18em] text-secondary">YS STORE</p>
        <h1 className="text-[34px] font-semibold tracking-[-0.03em] text-foreground">Create account</h1>
        <p className="text-sm text-secondary">Create your customer account with Google in one step.</p>
      </header>

      <section className="rounded-2xl border border-border bg-surface p-5 shadow-soft">
        <div className="space-y-4">
          {googleLoginMutation.isError ? (
            <InlineAlert
              tone="error"
              message={toUserMessage(googleLoginMutation.error, 'Google sign-up failed. Please try again.')}
            />
          ) : null}

          <Button
            type="button"
            size="lg"
            fullWidth
            loading={googleLoginMutation.isPending}
            disabled={googleLoginMutation.isPending}
            onClick={() => googleLoginMutation.mutate({ returnTo: '/shop' })}
          >
            Continue with Google
          </Button>

          <p className="text-center text-[12px] text-secondary">Customer accounts use Google sign-in only.</p>
        </div>

        <p className="mt-4 text-center text-[13px] text-secondary">
          Already have an account? <Link to="/login" className="font-semibold text-foreground hover:text-accent">Sign in with Google</Link>
        </p>
      </section>
      </div>
    </>
  );
}
