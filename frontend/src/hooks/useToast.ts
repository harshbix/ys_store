import { toast } from 'sonner';
import type { ToastMessage } from '../types/ui';

export function useToastMessages() {
  return [] as ToastMessage[];
}

export function useShowToast() {
  return (payload: Omit<ToastMessage, 'id'>) => {
    if (payload.variant === 'success') {
      toast.success(payload.title, { description: payload.description });
      return;
    }

    if (payload.variant === 'error') {
      toast.error(payload.title, { description: payload.description });
      return;
    }

    toast(payload.title, { description: payload.description });
  };
}

export function useDismissToast() {
  return (id?: string) => toast.dismiss(id);
}

export function useToast() {
  const showToast = useShowToast();
  const dismissToast = useDismissToast();

  return { toasts: [] as ToastMessage[], showToast, dismissToast };
}
