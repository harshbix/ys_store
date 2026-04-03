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
            transition={{ duration: 0.25 }}
            className="fixed inset-0 z-50 overflow-y-auto bg-background"
          >
            <div className="sticky top-0 z-10 flex h-[52px] items-center justify-between border-b border-border bg-[rgba(17,17,17,0.95)] px-4 backdrop-blur">
              <h2 className="inline-flex items-center gap-2 text-[13px] font-normal text-foreground">
                <SlidersHorizontal className="h-4 w-4" />
                Filters
              </h2>
              <button type="button" onClick={onClose} className="inline-flex h-9 w-9 items-center justify-center text-secondary" aria-label="Close filters">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-4">
              {children}
            </div>
          </motion.aside>
        </>
      ) : null}
    </AnimatePresence>
  );
}
