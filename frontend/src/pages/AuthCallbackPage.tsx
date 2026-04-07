import { useEffect, useMemo } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { PageLoader } from '../components/feedback/PageLoader';
import { useAuthStore } from '../store/auth';

function normalizeReturnTo(value: string | null): string {
  const fallback = '/shop';
  if (!value) return fallback;

  const trimmed = value.trim();
  if (!trimmed.startsWith('/')) return fallback;

  return trimmed;
}

export default function AuthCallbackPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  const authBootstrapReady = useAuthStore((state) => state.authBootstrapReady);
  const isAuthenticated = useAuthStore((state) => Boolean(state.accessToken && state.customerId));

  const returnTo = useMemo(() => normalizeReturnTo(searchParams.get('returnTo')), [searchParams]);

  useEffect(() => {
    if (!authBootstrapReady) return;

    if (isAuthenticated) {
      navigate(returnTo, { replace: true, state: { from: location.pathname } });
      return;
    }

    navigate('/login', {
      replace: true,
      state: {
        from: location.pathname,
        returnTo
      }
    });
  }, [authBootstrapReady, isAuthenticated, location.pathname, navigate, returnTo]);

  return <PageLoader />;
}