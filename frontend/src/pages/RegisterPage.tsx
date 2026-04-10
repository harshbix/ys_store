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
            variant="outline"
            className="w-full"
            disabled={googleLoginMutation.isPending}
            onClick={() => googleLoginMutation.mutate({ returnTo: '/shop' })}
          >
            {googleLoginMutation.isPending ? (
              <span className="animate-spin mr-2 h-4 w-4 rounded-full border-2 border-current border-t-transparent" />
            ) : (
              <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
            )}
            Sign in with Google
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
