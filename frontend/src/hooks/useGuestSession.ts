import { useEffect } from 'react';
import { useSessionStore } from '../store/session';

export function useGuestSession(): string {
  const guestSessionId = useSessionStore((state) => state.guestSessionId);
  const initializeSession = useSessionStore((state) => state.initializeSession);

  useEffect(() => {
    if (!guestSessionId) {
      initializeSession();
    }
  }, [guestSessionId, initializeSession]);

  return guestSessionId;
}
