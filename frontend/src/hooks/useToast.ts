import { create } from 'zustand';
import type { ToastMessage } from '../types/ui';

interface ToastStore {
  toasts: ToastMessage[];
  showToast: (toast: Omit<ToastMessage, 'id'>) => void;
  dismissToast: (id: string) => void;
  clearToasts: () => void;
}

function createToastId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `toast-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export const useToastStore = create<ToastStore>((set) => ({
  toasts: [],
  showToast: (toast) => {
    const id = createToastId();
    set((state) => ({ toasts: [...state.toasts, { ...toast, id }] }));
    window.setTimeout(() => {
      set((state) => ({ toasts: state.toasts.filter((entry) => entry.id !== id) }));
    }, 4200);
  },
  dismissToast: (id) => set((state) => ({ toasts: state.toasts.filter((toast) => toast.id !== id) })),
  clearToasts: () => set({ toasts: [] })
}));

export function useToastMessages() {
  return useToastStore((state) => state.toasts);
}

export function useShowToast() {
  return useToastStore((state) => state.showToast);
}

export function useDismissToast() {
  return useToastStore((state) => state.dismissToast);
}

export function useToast() {
  const toasts = useToastMessages();
  const showToast = useShowToast();
  const dismissToast = useDismissToast();

  return { toasts, showToast, dismissToast };
}
