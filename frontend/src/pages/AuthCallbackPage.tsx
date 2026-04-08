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
          navigate('/', { replace: true });
          return;
        }

        const email = session.user.email.toLowerCase();

        // Admin-Specific Redirection logic
        let adminRecord = null;
        try {
          const { data, error } = await supabase
            .from('admin_users')
            .select('email')
            .ilike('email', email) // Using ilike just in case for case-insensitivity
            .single();

          if (error) {
            console.error('Supabase admin_users query error:', error, 'Code:', error.code);
            if (error.code === '406' || error.code === '403' || error.message?.includes('RLS')) {
              console.error('Possible RLS issue preventing admin_users read for email:', email);
            }
          } else if (!data) {
            console.error('No adminRecord found (possible case sensitivity or missing record), email was:', email);
          }
          
          adminRecord = data;
        } catch (err) {
          console.error('Exception querying admin_users:', err);
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
            console.error('Admin hydration failed:', err);
          }
          // Redirect them to admin even if fetch fails momentarily based on DB check
          navigate('/admin', { replace: true });
        } else {
          // Normal user route
          navigate(returnTo === '/admin' ? '/' : returnTo, { replace: true });
        }
      } catch (err) {
        logError(err, 'AuthCallback.verifyAdminAndReroute');
        navigate('/', { replace: true });
      }
    }

    // If this looks like an admin login attempt (returnTo starts with /admin),
    // skip the customer auth check and go straight to the Supabase session check.
    const isAdminFlow = returnTo.startsWith('/admin');

    if (isAdminFlow) {
      verifyAdminAndReroute();
      return;
    }

    // For customer flows, require a customer session before proceeding.
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

    verifyAdminAndReroute();

  }, [authBootstrapReady, isAuthenticated, location.pathname, navigate, returnTo]);

  return <PageLoader />;
}
