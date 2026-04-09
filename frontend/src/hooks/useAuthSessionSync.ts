import { useEffect, useRef } from 'react';
import { useAuthStore } from '../store/auth';
import type { Subscription } from '@supabase/supabase-js';
import { logError } from '../utils/errors';

export function useAuthSessionSync(): void {
  const completeLogin = useAuthStore((state) => state.completeLogin);
  const logout = useAuthStore((state) => state.logout);
  const setAuthBootstrapReady = useAuthStore((state) => state.setAuthBootstrapReady);
  const subRef = useRef<Subscription | null>(null);

  useEffect(() => {
    let mounted = true;

    const bootstrap = async () => {
      try {
        const { supabase } = await import('../lib/supabase');
        const { data, error } = await supabase.auth.getSession();
        if (error) throw error;

        const session = data.session;
        if (!mounted) return;

        if (session?.user?.id && session.access_token) {
          const userMeta = session.user.user_metadata || {};
          const fullName = userMeta.full_name || userMeta.name || null;
          completeLogin(session.access_token, session.user.id, session.user.email || null, fullName);
        } else {
          logout();
        }

        const { data: authSubscription } = supabase.auth.onAuthStateChange((_event, currentSession) => {
          if (currentSession?.user?.id && currentSession.access_token) {
            const currentMeta = currentSession.user.user_metadata || {};
            const currentFullName = currentMeta.full_name || currentMeta.name || null;
            completeLogin(currentSession.access_token, currentSession.user.id, currentSession.user.email || null, currentFullName);
          } else {
            logout();
          }
        });
        
        subRef.current = authSubscription.subscription;

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

    return () => {
      mounted = false;
      if (subRef.current) {
        subRef.current.unsubscribe();
      }
    };
  }, [completeLogin, logout, setAuthBootstrapReady]);
}
