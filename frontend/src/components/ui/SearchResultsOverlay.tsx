import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useProducts } from '../../hooks/useProducts';
import { SearchInput } from './SearchInput';
import { PriceDisplay } from './PriceDisplay';

type SearchResultsOverlayProps = {
  open: boolean;
  onClose: () => void;
};

export function SearchResultsOverlay({ open, onClose }: SearchResultsOverlayProps) {
  const [query, setQuery] = useState('');

  const productsQuery = useProducts({
    brand: query || undefined,
    page: 1,
    limit: 10,
    sort: 'newest'
  });

  const items = useMemo(() => productsQuery.data?.data.items || [], [productsQuery.data?.data.items]);

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
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="fixed inset-x-4 top-20 z-50 mx-auto max-w-3xl rounded-2xl border border-border bg-surface p-4"
            role="dialog"
            aria-modal="true"
            aria-label="Search products"
          >
            <div className="mb-3 flex items-center justify-between gap-3">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">Search Catalog</h2>
              <button onClick={onClose} type="button" className="rounded-md border border-border p-2" aria-label="Close search">
                <X className="h-4 w-4" />
              </button>
            </div>

            <SearchInput value={query} onDebouncedChange={setQuery} placeholder="Search by brand" />

            <div className="mt-3 max-h-[55vh] overflow-y-auto rounded-xl border border-border">
              {!query ? (
                <p className="p-4 text-sm text-muted">Start typing a brand name to search the catalog.</p>
              ) : null}

              {productsQuery.isLoading ? (
                <div className="space-y-2 p-3">
                  {Array.from({ length: 4 }).map((_, index) => (
                    <div key={`search-skeleton-${index}`} className="h-12 animate-pulse rounded-lg border border-border bg-background" />
                  ))}
                </div>
              ) : null}

              {productsQuery.isError ? <p className="p-4 text-sm text-danger">Unable to fetch search results right now.</p> : null}

              {!productsQuery.isLoading && !productsQuery.isError && query && items.length === 0 ? (
                <p className="p-4 text-sm text-muted">No matching products found.</p>
              ) : null}

              {items.map((product) => (
                <Link
                  key={product.id}
                  to={`/products/${product.slug}`}
                  onClick={onClose}
                  className="flex items-center justify-between gap-3 border-b border-border px-4 py-3 text-sm last:border-b-0 hover:bg-surfaceElevated"
                >
                  <div>
                    <p className="font-medium text-foreground">{product.title}</p>
                    <p className="text-xs text-muted">{product.brand}</p>
                  </div>
                  <PriceDisplay amount={product.estimated_price_tzs} className="text-sm font-semibold" />
                </Link>
              ))}
            </div>
          </motion.section>
        </>
      ) : null}
    </AnimatePresence>
  );
}
