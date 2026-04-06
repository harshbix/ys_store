import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import { useMemo } from 'react';
import { useProducts } from '../../hooks/useProducts';
import type { ComponentType, Product } from '../../types/api';
import { formatTzs } from '../../lib/currency';
import { getProductImage, placeholderForProduct } from '../../utils/imageFallback';

type BuildPartPickerProps = {
  componentType: ComponentType | null;
  open: boolean;
  onClose: () => void;
  onSelect: (product: Product) => void;
};

export function BuildPartPicker({ componentType, open, onClose, onSelect }: BuildPartPickerProps) {
  const productsQuery = useProducts({ type: 'component', page: 1, limit: 24, sort: 'newest', stock_status: 'in_stock' });

  const products = useMemo(() => productsQuery.data?.items ?? [], [productsQuery.data?.items]);

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

            {productsQuery.isLoading ? (
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 6 }).map((_, index) => (
                  <div key={`build-picker-skeleton-${index}`} className="h-24 animate-pulse rounded-xl border border-border bg-surface" />
                ))}
              </div>
            ) : null}

            {productsQuery.isError ? <p className="text-sm text-danger">Failed to load components.</p> : null}

            {!productsQuery.isLoading && !productsQuery.isError && products.length === 0 ? (
              <p className="text-sm text-muted">No in-stock components available right now.</p>
            ) : null}

            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {products.map((product) => (
                <button
                  key={product.id}
                  type="button"
                  onClick={() => onSelect(product)}
                  className="rounded-xl border border-border bg-surface p-3 text-left transition hover:border-accent"
                >
                  <div className="flex items-start gap-3">
                    <img
                      src={getProductImage(product)}
                      alt={product.title}
                      loading="lazy"
                      className="h-16 w-16 shrink-0 rounded-lg border border-border object-cover"
                      onError={(event) => {
                        const fallback = placeholderForProduct(product);
                        if (event.currentTarget.src.endsWith(fallback)) return;
                        event.currentTarget.src = fallback;
                      }}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-foreground">{product.title}</p>
                      <p className="mt-1 text-xs text-muted">{product.brand}</p>
                      <p className="mt-3 text-sm font-semibold text-foreground">{formatTzs(product.estimated_price_tzs)}</p>
                    </div>
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
