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

    if (!isAuthenticated) {
      navigate('/login', {
        replace: true,
        state: {
          from: location.pathname,
          returnTo
        }
      });
      return;
    }

    if (checkingAdminRef.current) return;
    checkingAdminRef.current = true;

    async function verifyAdminAndReroute() {
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError || !session?.user?.email) {
          navigate(returnTo, { replace: true });
          return;
        }

        const email = session.user.email.toLowerCase();

        try {
          const meResponse = await apiFetch<ApiEnvelope<{ admin: AdminUser }>>('/admin/me', {
            method: 'GET',
            headers: { Authorization: `Bearer ${session.access_token}` }
          });
          
          if (meResponse.data?.admin) {
            useAdminAuthStore.getState().setSession(session.access_token, meResponse.data.admin as any);
            navigate(returnTo === '/shop' ? '/admin' : returnTo, { replace: true });
            return;
          }
        } catch (err) {
          // If it fails, they are simply not an admin.
        }

        navigate(returnTo, { replace: true, state: { from: location.pathname } });
      } catch (err) {
        logError(err, 'AuthCallback.verifyAdminAndReroute');
        navigate(returnTo, { replace: true, state: { from: location.pathname } });
      }
    }

    verifyAdminAndReroute();

  }, [authBootstrapReady, isAuthenticated, location.pathname, navigate, returnTo]);

  return <PageLoader />;
}
