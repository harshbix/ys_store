import { useEffect, useMemo, useRef } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { PageLoader } from '../components/feedback/PageLoader';
import { useAuthStore } from '../store/auth';
import { supabase } from '../lib/supabase';
import { logError } from '../utils/errors';

function normalizeReturnTo(value: string | null): string {
  const fallback = '/shop';
  if (!value) return fallback;

  const trimmed = value.trim();
  if (!trimmed.startsWith('/')) return fallback;

  // Admin routes should not be redirected from OAuth callback
  if (trimmed.startsWith('/admin')) return fallback;

  return trimmed;
}

export default function AuthCallbackPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const authBootstrapRef = useRef(false);

  const authBootstrapReady = useAuthStore((state) => state.authBootstrapReady);
  const completeLogin = useAuthStore((state) => state.completeLogin);

  const returnTo = useMemo(() => normalizeReturnTo(searchParams.get('returnTo')), [searchParams]);

  useEffect(() => {
    if (!authBootstrapReady) return;
    if (authBootstrapRef.current) return;
    authBootstrapRef.current = true;

    async function processOAuthCallback() {
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        if (sessionError || !session?.user) {
          console.warn('[AuthCallback] No Supabase session returned. Redirecting to checkout.');
          navigate('/', { replace: true });
          return;
        }

        // For customer OAuth, associate with the customer
        const customerId = session.user.id;
        const email = session.user.email;

        if (!customerId) {
          console.warn('[AuthCallback] Session has no user id.');
          navigate('/', { replace: true });
          return;
        }

        console.log('[AuthCallback] OAuth session established for customer:', email);
        
        // Complete the customer login
        completeLogin(session.access_token, customerId, email);
        
        // Redirect to original location or checkout
        navigate(returnTo, { replace: true });
      } catch (err) {
        logError(err, 'AuthCallback.processOAuthCallback');
        navigate('/', { replace: true });
      }
    }

    processOAuthCallback();
  }, [authBootstrapReady, completeLogin, navigate, returnTo]);

  return <PageLoader />;
}
