import { create } from 'zustand';

export type ApiIssueType = 'missing_env' | 'network' | 'timeout' | 'server' | 'bad_json' | 'http_error';

interface UiState {
  mobileNavOpen: boolean;
  filterDrawerOpen: boolean;
  cartDrawerOpen: boolean;
  accountModalOpen: boolean;
  searchOverlayOpen: boolean;
  selectedComponentType: string | null;
  apiUnavailable: boolean;
  apiIssueType: ApiIssueType | null;
  apiIssueMessage: string | null;
  apiIssueStatus: number | null;
  apiIssueEndpoint: string | null;
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
  setApiIssue: (payload: {
    type: ApiIssueType;
    message: string;
    status?: number | null;
    endpoint?: string | null;
  }) => void;
  clearApiIssue: () => void;
}

export const useUiStore = create<UiState>((set) => ({
  mobileNavOpen: false,
  filterDrawerOpen: false,
  cartDrawerOpen: false,
  accountModalOpen: false,
  searchOverlayOpen: false,
  selectedComponentType: null,
  apiUnavailable: false,
  apiIssueType: null,
  apiIssueMessage: null,
  apiIssueStatus: null,
  apiIssueEndpoint: null,
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
  setSelectedComponentType: (value) => set({ selectedComponentType: value }),
  setApiIssue: ({ type, message, status = null, endpoint = null }) => set({
    apiUnavailable: true,
    apiIssueType: type,
    apiIssueMessage: message,
    apiIssueStatus: status,
    apiIssueEndpoint: endpoint
  }),
  clearApiIssue: () => set({
    apiUnavailable: false,
    apiIssueType: null,
    apiIssueMessage: null,
    apiIssueStatus: null,
    apiIssueEndpoint: null
  })
}));
