import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AppState {
  guestSessionId: string;
  wishlist: string[];
  currentBuildId: string | null;
  toggleWishlist: (productId: string) => void;
  setCurrentBuildId: (id: string | null) => void;
}

export const useStore = create<AppState>()(
  persist(
    (set) => ({
      // Guarantee locally scoped but stable session IDs for guests matching live test E2E behavior
      guestSessionId: `guest_live_${crypto.randomUUID().replace(/-/g, '').substring(0, 12)}`,
      wishlist: [],
      currentBuildId: null,

      toggleWishlist: (id) => set((state) => ({
        wishlist: state.wishlist.includes(id) 
          ? state.wishlist.filter(w => w !== id)
          : [...state.wishlist, id]
      })),

      setCurrentBuildId: (id) => set({ currentBuildId: id })
    }),
    { name: 'ys-store-prefs' }
  )
);