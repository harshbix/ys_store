import type { PropsWithChildren } from 'react';
import { Toast } from './Toast';
import { useToast } from '../../hooks/useToast';

export function ToastProvider({ children }: PropsWithChildren) {
  const { toasts, dismissToast } = useToast();

  return (
    <>
      {children}
      <Toast toasts={toasts} onDismiss={dismissToast} />
    </>
  );
}
