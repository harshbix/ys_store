import type { PropsWithChildren } from 'react';
import { Toaster } from 'sonner';
import 'sonner/dist/styles.css';

export function ToastProvider({ children }: PropsWithChildren) {
  return (
    <>
      {children}
      <Toaster
        position="top-right"
        richColors
        closeButton
        duration={4200}
        toastOptions={{
          classNames: {
            toast: 'rounded-[2px] border border-border bg-surface text-foreground',
            title: 'text-[13px] font-medium',
            description: 'text-[12px] text-muted'
          }
        }}
      />
    </>
  );
}
