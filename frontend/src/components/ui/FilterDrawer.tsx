import { AnimatePresence, motion } from 'framer-motion';
import { SlidersHorizontal, X } from 'lucide-react';
import type { ReactNode } from 'react';

type FilterDrawerProps = {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
};

export function FilterDrawer({ open, onClose, children }: FilterDrawerProps) {
  return (
    <AnimatePresence>
      {open ? (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-black/70"
          />
          <motion.aside
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', bounce: 0.1, duration: 0.3 }}
            className="fixed inset-y-0 right-0 z-50 w-80 max-w-[88vw] overflow-y-auto border-l border-border bg-background p-4"
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="inline-flex items-center gap-2 text-base font-semibold">
                <SlidersHorizontal className="h-4 w-4" />
                Filters
              </h2>
              <button type="button" onClick={onClose} className="rounded-md border border-border p-2" aria-label="Close filters">
                <X className="h-4 w-4" />
              </button>
            </div>
            {children}
          </motion.aside>
        </>
      ) : null}
    </AnimatePresence>
  );
}
