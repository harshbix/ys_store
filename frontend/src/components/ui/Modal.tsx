import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import type { PropsWithChildren } from 'react';
import { cn } from '../../lib/cn';

interface ModalProps extends PropsWithChildren {
  open: boolean;
  onClose: () => void;
  title?: string;
  className?: string;
}

export function Modal({ open, onClose, title, children, className }: ModalProps) {
  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="fixed inset-0 z-[80] flex items-center justify-center bg-overlay/70 px-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.section
            role="dialog"
            aria-modal="true"
            aria-label={title || 'Dialog'}
            className={cn('w-full max-w-lg rounded-[2px] border border-border bg-surface p-4 shadow-soft', className)}
            initial={{ opacity: 0, y: 8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={{ duration: 0.16 }}
            onClick={(event) => event.stopPropagation()}
          >
            <header className="mb-3 flex items-start justify-between gap-3">
              {title ? <h2 className="text-[15px] font-medium text-foreground">{title}</h2> : <span />}
              <button type="button" onClick={onClose} aria-label="Close dialog" className="rounded-[2px] p-1 text-muted transition hover:bg-surfaceHover hover:text-foreground">
                <X className="h-4 w-4" />
              </button>
            </header>
            {children}
          </motion.section>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
