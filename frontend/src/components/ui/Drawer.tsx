import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import type { PropsWithChildren } from 'react';
import { cn } from '../../lib/cn';
import { drawerMotion } from '../../lib/motion';

interface DrawerProps extends PropsWithChildren {
  open: boolean;
  onClose: () => void;
  title?: string;
  side?: 'left' | 'right';
  className?: string;
}

export function Drawer({ open, onClose, title, side = 'right', className, children }: DrawerProps) {
  const originClass = side === 'left' ? 'justify-start' : 'justify-end';

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className={cn('fixed inset-0 z-[75] flex bg-overlay/70', originClass)}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.aside
            role="dialog"
            aria-modal="true"
            aria-label={title || 'Drawer'}
            variants={drawerMotion}
            initial="hidden"
            animate="visible"
            exit="exit"
            className={cn('h-full w-full max-w-md border-l border-border bg-surface shadow-soft', className)}
            onClick={(event) => event.stopPropagation()}
          >
            <header className="flex items-center justify-between border-b border-border px-4 py-3">
              <h2 className="text-[14px] font-medium text-foreground">{title || 'Panel'}</h2>
              <button type="button" onClick={onClose} aria-label="Close panel" className="rounded-[2px] p-1 text-muted transition hover:bg-surfaceHover hover:text-foreground">
                <X className="h-4 w-4" />
              </button>
            </header>
            <div className="h-[calc(100%-49px)] overflow-y-auto px-4 py-4">{children}</div>
          </motion.aside>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
