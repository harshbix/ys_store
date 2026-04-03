import { AnimatePresence, motion } from 'framer-motion';
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react';
import type { ToastMessage } from '../../types/ui';

type ToastProps = {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
};

function iconForVariant(variant: ToastMessage['variant']) {
  if (variant === 'success') return <CheckCircle2 className="h-4 w-4 text-success" />;
  if (variant === 'error') return <AlertCircle className="h-4 w-4 text-danger" />;
  return <Info className="h-4 w-4 text-accent" />;
}

export function Toast({ toasts, onDismiss }: ToastProps) {
  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-[70] flex w-[calc(100%-2rem)] max-w-sm flex-col gap-2">
      <AnimatePresence initial={false}>
        {toasts.map((toast) => (
          <motion.article
            key={toast.id}
            layout
            initial={{ opacity: 0, y: 20, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.98 }}
            transition={{ duration: 0.2 }}
            role="status"
            aria-live="polite"
            className="pointer-events-auto rounded-xl border border-border bg-surfaceElevated p-3 text-foreground shadow-xl"
          >
            <div className="flex items-start gap-2">
              <span className="mt-0.5">{iconForVariant(toast.variant)}</span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold">{toast.title}</p>
                {toast.description ? <p className="mt-1 text-xs text-muted">{toast.description}</p> : null}
              </div>
              <button
                type="button"
                aria-label="Dismiss notification"
                onClick={() => onDismiss(toast.id)}
                className="rounded-md p-1 text-muted transition hover:bg-surface hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </motion.article>
        ))}
      </AnimatePresence>
    </div>
  );
}
