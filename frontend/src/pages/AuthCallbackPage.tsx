import { useEffect, useMemo, useRef } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { PageLoader } from '../components/feedback/PageLoader';
import { useAuthStore, useAdminAuthStore } from '../store/auth';
import { supabase } from '../lib/supabase';
import { apiFetch } from '../lib/apiClient';
import type { ApiEnvelope } from '../types/api';
import type { AdminUser } from '../types/admin';
import { logError } from '../utils/errors';

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
  const checkingAdminRef = useRef(false);

  const authBootstrapReady = useAuthStore((state) => state.authBootstrapReady);
  const isAuthenticated = useAuthStore((state) => Boolean(state.accessToken && state.customerId));

  const returnTo = useMemo(() => normalizeReturnTo(searchParams.get('returnTo')), [searchParams]);

  useEffect(() => {
    if (!authBootstrapReady) return;

    if (checkingAdminRef.current) return;
    checkingAdminRef.current = true;

    async function verifyAdminAndReroute() {
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        if (sessionError || !session?.user?.email) {
          console.warn('[AuthCallback] No Supabase session after OAuth return. Redirecting home.');
          navigate('/', { replace: true });
          return;
        }

        const email = session.user.email.toLowerCase();
        console.log('[AuthCallback] Session resolved for:', email);

        // Check if this user is an admin
        let adminRecord = null;
        try {
          const { data, error } = await supabase
            .from('admin_users')
            .select('email')
            .ilike('email', email)
            .single();

          if (error) {
            console.error('[AuthCallback] admin_users query error:', error.code, error.message);
          }
          adminRecord = data;
        } catch (err) {
          console.error('[AuthCallback] Exception querying admin_users:', err);
        }

        if (adminRecord) {
          try {
            const meResponse = await apiFetch<ApiEnvelope<{ admin: AdminUser }>>('/admin/me', {
              method: 'GET',
              headers: { Authorization: `Bearer ${session.access_token}` }
            });

            if (meResponse.data?.admin) {
              useAdminAuthStore.getState().setSession(session.access_token, meResponse.data.admin as any);
              navigate('/admin', { replace: true });
              return;
            }
          } catch (err) {
            console.error('[AuthCallback] /admin/me fetch failed:', err);
          }
          // Still redirect to admin even if /admin/me hydration fails — the session is set
          navigate('/admin', { replace: true });
        } else {
          // Regular customer
          navigate(returnTo === '/admin' ? '/' : returnTo, { replace: true });
        }
      } catch (err) {
        logError(err, 'AuthCallback.verifyAdminAndReroute');
        navigate('/', { replace: true });
      }
    }

    // Admin flow: skip customer-auth check, go straight to Supabase session check
    const isAdminFlow = returnTo.startsWith('/admin');
    if (isAdminFlow) {
      verifyAdminAndReroute();
      return;
    }

    // Customer flow: must have a customer session
    if (!isAuthenticated) {
      navigate('/login', {
        replace: true,
        state: { from: location.pathname, returnTo }
      });
      return;
    }

    verifyAdminAndReroute();

  }, [authBootstrapReady, isAuthenticated, location.pathname, navigate, returnTo]);

  return <PageLoader />;
}
