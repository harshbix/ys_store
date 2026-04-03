import { create } from 'zustand';

interface UiState {
  mobileNavOpen: boolean;
  filterDrawerOpen: boolean;
  cartDrawerOpen: boolean;
  accountModalOpen: boolean;
  searchOverlayOpen: boolean;
  selectedComponentType: string | null;
  openMobileNav: () => void;
  closeMobileNav: () => void;
  openFilterDrawer: () => void;
  closeFilterDrawer: () => void;
  openCartDrawer: () => void;
  closeCartDrawer: () => void;
  openAccountModal: () => void;
  closeAccountModal: () => void;
  openSearchOverlay: () => void;
  closeSearchOverlay: () => void;
  setSelectedComponentType: (value: string | null) => void;
}

export const useUiStore = create<UiState>((set) => ({
  mobileNavOpen: false,
  filterDrawerOpen: false,
  cartDrawerOpen: false,
  accountModalOpen: false,
  searchOverlayOpen: false,
  selectedComponentType: null,
  openMobileNav: () => set({ mobileNavOpen: true }),
  closeMobileNav: () => set({ mobileNavOpen: false }),
  openFilterDrawer: () => set({ filterDrawerOpen: true }),
  closeFilterDrawer: () => set({ filterDrawerOpen: false }),
  openCartDrawer: () => set({ cartDrawerOpen: true }),
  closeCartDrawer: () => set({ cartDrawerOpen: false }),
  openAccountModal: () => set({ accountModalOpen: true }),
  closeAccountModal: () => set({ accountModalOpen: false }),
  openSearchOverlay: () => set({ searchOverlayOpen: true }),
  closeSearchOverlay: () => set({ searchOverlayOpen: false }),
  setSelectedComponentType: (value) => set({ selectedComponentType: value })
}));
