import type { PropsWithChildren } from 'react';
import { Toast } from './Toast';
import { useDismissToast, useToastMessages } from '../../hooks/useToast';

export function ToastProvider({ children }: PropsWithChildren) {
  const toasts = useToastMessages();
  const dismissToast = useDismissToast();

  return (
    <>
      {children}
      <Toast toasts={toasts} onDismiss={dismissToast} />
    </>
  );
}
