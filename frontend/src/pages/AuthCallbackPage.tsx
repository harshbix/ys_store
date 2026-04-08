import { useEffect, useMemo, useRef } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { PageLoader } from '../components/feedback/PageLoader';
import { useAuthStore, useAdminAuthStore } from '../store/auth';
import { supabase } from '../lib/supabase';
import { logError } from '../utils/errors';

const ALLOWED_ADMINS = ['kidabixson@gmail.com', 'yusuphshitambala@gmail.com'];

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

        if (ALLOWED_ADMINS.includes(email)) {
          const { data: dbAdmin } = await supabase
            .from('admin_users')
            .select('id, email, full_name, role, is_active')
          let activeAdmin = dbAdmin;

          if (!activeAdmin) {
             const { data: upsertedAdmin, error: upsertErr } = await supabase
              .from('admin_users')
              .upsert({
                id: session.user.id,
                email: email,
                full_name: session.user.user_metadata?.full_name || email.split('@')[0],
                role: 'owner',
                is_active: true
              }, { onConflict: 'email' })
              .select('id, email, full_name, role, is_active')
              .single();

              if (upsertedAdmin && !upsertErr) {
                activeAdmin = upsertedAdmin;
              } else if (upsertErr) {
                logError(upsertErr, 'AuthCallback.adminUpsert');
              }
          } else {
             if (activeAdmin.id !== session.user.id) {
               await supabase.from('admin_users').update({ 
                 id: session.user.id,
                 full_name: session.user.user_metadata?.full_name || activeAdmin.full_name
               }).eq('email', email);
               activeAdmin.id = session.user.id;
             }
          }

          if (activeAdmin && activeAdmin.is_active && (activeAdmin.role === 'owner' || activeAdmin.role === 'admin')) {
             useAdminAuthStore.getState().setSession(session.access_token, activeAdmin as any);
             
             navigate(returnTo === '/shop' ? '/admin' : returnTo, { replace: true });
             return;
          }
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
