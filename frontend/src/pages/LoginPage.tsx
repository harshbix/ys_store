import { useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { InlineAlert } from '../components/feedback/InlineAlert';
import { Button } from '../components/ui/Button';
import { useAuth } from '../hooks/useAuth';
import { toUserMessage } from '../utils/errors';

type LocationState = {
  from?: string;
  returnTo?: string;
};

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, googleLoginMutation } = useAuth();

  const routeState = (location.state as LocationState | null) || null;
  const returnTo = routeState?.returnTo || routeState?.from || '/shop';

  useEffect(() => {
    if (!isAuthenticated) return;
    navigate(returnTo || '/shop', { replace: true });
  }, [isAuthenticated, navigate, returnTo]);

  return (
    <div className="mx-auto max-w-md space-y-6 pb-10 pt-2">
      <header className="space-y-2 text-center">
        <p className="text-[12px] font-medium tracking-[0.18em] text-secondary">YS STORE</p>
        <h1 className="text-[34px] font-semibold tracking-[-0.03em] text-foreground">Sign in</h1>
        <p className="text-sm text-secondary">Continue securely with your Google account.</p>
      </header>

      <section className="rounded-2xl border border-border bg-surface p-5 shadow-soft">
        <div className="space-y-4">
          {googleLoginMutation.isError ? (
            <InlineAlert tone="error" message={toUserMessage(googleLoginMutation.error, 'Google sign-in failed. Please try again.')} />
          ) : null}

          <Button
            type="button"
            size="lg"
            fullWidth
            loading={googleLoginMutation.isPending}
            disabled={googleLoginMutation.isPending}
            onClick={() => googleLoginMutation.mutate({ returnTo })}
          >
            Continue with Google
          </Button>

          <p className="text-center text-[12px] text-secondary">Email and password login is disabled for customers.</p>
        </div>

        <p className="mt-4 text-center text-sm text-secondary">
          First time here? <Link to="/register" className="font-semibold text-foreground hover:text-accent">Create account with Google</Link>
        </p>
      </section>
    </div>
  );
}
