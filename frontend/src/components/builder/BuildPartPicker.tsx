import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import { useMemo } from 'react';
import { useComponentsQuery } from '../../hooks/usePCBuilder';
import type { ComponentType, PCComponent } from '../../types/api';
import { formatTzs } from '../../lib/currency';

type BuildPartPickerProps = {
  componentType: ComponentType | null;
  open: boolean;
  onClose: () => void;
  onSelect: (component: PCComponent) => void;
};

export function BuildPartPicker({ componentType, open, onClose, onSelect }: BuildPartPickerProps) {
  const componentsQuery = useComponentsQuery(componentType);

  const components = useMemo(() => componentsQuery.data ?? [], [componentsQuery.data]);

  return (
    <AnimatePresence>
      {open ? (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-overlay/70"
            onClick={onClose}
          />
          <motion.section
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ duration: 0.28 }}
            className="fixed inset-x-0 bottom-0 z-50 max-h-[85vh] overflow-y-auto rounded-t-2xl border-t border-border bg-background p-4"
            role="dialog"
            aria-modal="true"
            aria-label="Select a component"
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-base font-semibold text-foreground">Pick {componentType || 'component'}</h2>
              <button onClick={onClose} type="button" className="rounded-md border border-border p-2" aria-label="Close picker">
                <X className="h-4 w-4" />
              </button>
            </div>

            {componentsQuery.isLoading ? (
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 6 }).map((_, index) => (
                  <div key={`build-picker-skeleton-${index}`} className="h-24 animate-pulse rounded-xl border border-border bg-surface" />
                ))}
              </div>
            ) : null}

            {componentsQuery.isError ? <p className="text-sm text-danger">Failed to load components.</p> : null}

            {!componentsQuery.isLoading && !componentsQuery.isError && components.length === 0 ? (
              <p className="text-sm text-muted">No components available for this type.</p>
            ) : null}

            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {components.map((component) => (
                <button
                  key={component.id}
                  type="button"
                  onClick={() => onSelect(component)}
                  className="rounded-xl border border-border bg-surface p-3 text-left transition hover:border-accent"
                >
                  <div className="flex flex-col gap-2">
                    <p className="font-semibold text-foreground text-sm">{component.name}</p>
                    <p className="text-xs text-muted line-clamp-2">{component.type}</p>
                    <p className="mt-2 text-sm font-semibold text-accent">{formatTzs(component.price_tzs || 0)}</p>
                  </div>
                </button>
              ))}
            </div>
          </motion.section>
        </>
      ) : null}
    </AnimatePresence>
  );
}
