import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { generateGuestSessionId } from '../lib/session';
import type { WishlistRef } from '../types/ui';

interface SessionState {
  guestSessionId: string;
  activeBuildId: string | null;
  wishlist: WishlistRef[];
  accountPromptSeen: boolean;
  initializeSession: () => void;
  setActiveBuildId: (buildId: string | null) => void;
  addToWishlist: (item: WishlistRef) => void;
  removeFromWishlist: (productId: string) => void;
  toggleWishlist: (item: WishlistRef) => void;
  markAccountPromptSeen: () => void;
}

export const useSessionStore = create<SessionState>()(
  persist(
    (set, get) => ({
      guestSessionId: generateGuestSessionId(),
      activeBuildId: null,
      wishlist: [],
      accountPromptSeen: false,
      addToWishlist: (item) =>
        set((state) => ({
          wishlist: state.wishlist.some((entry) => entry.id === item.id)
            ? state.wishlist
            : [...state.wishlist, item]
        })),
      removeFromWishlist: (productId) =>
        set((state) => ({
          wishlist: state.wishlist.filter((item) => item.id !== productId)
        })),
      toggleWishlist: (item) => {
        const exists = get().wishlist.some((entry) => entry.id === item.id);
        if (exists) {
          get().removeFromWishlist(item.id);
          return;
        }
        get().addToWishlist(item);
      },
      setActiveBuildId: (buildId) => set({ activeBuildId: buildId }),
      markAccountPromptSeen: () => set({ accountPromptSeen: true }),
      initializeSession: () => {
        const current = get().guestSessionId;
        if (typeof current === 'string' && current.trim().length > 0) return;
        set({ guestSessionId: generateGuestSessionId() });
      }
    }),
    {
      name: 'ys-session-storage'
    }
  )
);
