import { useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/auth';
import { logError } from '../utils/errors';

export function useAuthSessionSync(): void {
  const completeLogin = useAuthStore((state) => state.completeLogin);
  const logout = useAuthStore((state) => state.logout);
  const setAuthBootstrapReady = useAuthStore((state) => state.setAuthBootstrapReady);

  useEffect(() => {
    let mounted = true;

    const bootstrap = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        if (error) throw error;

        const session = data.session;
        if (!mounted) return;

        if (session?.user?.id && session.access_token) {
          completeLogin(session.access_token, session.user.id, session.user.email || null);
        } else {
          logout();
        }
      } catch (error) {
        logError(error, 'auth.sessionSync.bootstrap');
        if (mounted) {
          logout();
        }
      } finally {
        if (mounted) {
          setAuthBootstrapReady(true);
        }
      }
    };

    bootstrap();

    const { data: authSubscription } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user?.id && session.access_token) {
        completeLogin(session.access_token, session.user.id, session.user.email || null);
      } else {
        logout();
      }
    });

    return () => {
      mounted = false;
      authSubscription.subscription.unsubscribe();
    };
  }, [completeLogin, logout, setAuthBootstrapReady]);
}
