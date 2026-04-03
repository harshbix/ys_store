import { SlidersHorizontal } from 'lucide-react';
import { motion } from 'framer-motion';
import { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useCart } from '../hooks/useCart';
import { useProducts } from '../hooks/useProducts';
import { useWishlist } from '../hooks/useWishlist';
import { useUiStore } from '../store/ui';
import type { ProductFilters } from '../types/ui';
import { ActiveFilters } from '../components/ui/ActiveFilters';
import { FilterDrawer } from '../components/ui/FilterDrawer';
import { FilterPanel } from '../components/ui/FilterPanel';
import { ProductGrid } from '../components/ui/ProductGrid';
import { SearchInput } from '../components/ui/SearchInput';
import { SortControl } from '../components/ui/SortControl';
import { SkeletonGrid } from '../components/feedback/SkeletonGrid';
import { EmptyState } from '../components/feedback/EmptyState';
import { ErrorState } from '../components/feedback/ErrorState';

function parseNum(value: string | null): number | undefined {
  if (!value) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function readFilters(searchParams: URLSearchParams): ProductFilters {
  return {
    type: (searchParams.get('type') as ProductFilters['type']) || undefined,
    brand: searchParams.get('brand') || undefined,
    condition: (searchParams.get('condition') as ProductFilters['condition']) || undefined,
    min_price: parseNum(searchParams.get('min_price')),
    max_price: parseNum(searchParams.get('max_price')),
    cpu: searchParams.get('cpu') || undefined,
    gpu: searchParams.get('gpu') || undefined,
    ram_gb: parseNum(searchParams.get('ram_gb')),
    storage_gb: parseNum(searchParams.get('storage_gb')),
    screen_size: parseNum(searchParams.get('screen_size')),
    refresh_rate: parseNum(searchParams.get('refresh_rate')),
    stock_status: (searchParams.get('stock_status') as ProductFilters['stock_status']) || undefined,
    page: parseNum(searchParams.get('page')) || 1,
    limit: parseNum(searchParams.get('limit')) || 16,
    sort: (searchParams.get('sort') as ProductFilters['sort']) || 'newest'
  };
}

function writeFilters(current: ProductFilters, patch: Partial<ProductFilters>): URLSearchParams {
  const next: ProductFilters = { ...current, ...patch };
  const params = new URLSearchParams();

  (Object.keys(next) as Array<keyof ProductFilters>).forEach((key) => {
    const value = next[key];
    if (value !== undefined && value !== '' && value !== null) {
      params.set(key, String(value));
    }
  });

  return params;
}

export default function ShopPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const filters = readFilters(searchParams);
  const productsQuery = useProducts(filters);
  const { addItem } = useCart();
  const { isInWishlist, toggle } = useWishlist();
  const filterOpen = useUiStore((state) => state.filterDrawerOpen);
  const openFilterDrawer = useUiStore((state) => state.openFilterDrawer);
  const closeFilterDrawer = useUiStore((state) => state.closeFilterDrawer);

  const products = productsQuery.data?.data.items || [];
  const total = productsQuery.data?.data.total || 0;
  const totalPages = Math.max(1, Math.ceil(total / filters.limit));

  const title = useMemo(() => {
    if (filters.type) return `${filters.type.charAt(0).toUpperCase()}${filters.type.slice(1)} Catalog`;
    return 'Full Catalog';
  }, [filters.type]);

  const patchFilters = (patch: Partial<ProductFilters>) => {
    setSearchParams(writeFilters(filters, patch));
  };

  const resetFilters = () => {
    setSearchParams(new URLSearchParams({ page: '1', limit: String(filters.limit), sort: 'newest' }));
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4 pb-8">
      <header className="space-y-3">
        <h1 className="font-display text-2xl font-semibold text-foreground">{title}</h1>
        <p className="text-sm text-muted">{total} products found</p>

        <div className="flex flex-wrap items-center gap-2">
          <div className="min-w-[220px] flex-1">
            <SearchInput value={filters.brand || ''} onDebouncedChange={(value) => patchFilters({ brand: value || undefined, page: 1 })} placeholder="Search by brand" />
          </div>
          <SortControl value={filters.sort} onChange={(value) => patchFilters({ sort: value, page: 1 })} />
          <button
            type="button"
            onClick={openFilterDrawer}
            className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-border px-4 text-sm font-semibold lg:hidden"
          >
            <SlidersHorizontal className="h-4 w-4" />
            Filters
          </button>
        </div>

        <ActiveFilters
          filters={filters}
          onClearOne={(key) => patchFilters({ [key]: undefined, page: 1 })}
          onClearAll={resetFilters}
        />
      </header>

      <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
        <aside className="hidden lg:block lg:sticky lg:top-20 lg:self-start">
          <FilterPanel filters={filters} onPatch={patchFilters} onReset={resetFilters} />
        </aside>

        <section>
          {productsQuery.isLoading ? <SkeletonGrid count={10} /> : null}
          {productsQuery.isError ? <ErrorState onRetry={() => productsQuery.refetch()} /> : null}
          {!productsQuery.isLoading && !productsQuery.isError && products.length === 0 ? (
            <EmptyState title="No products match these filters" description="Adjust filters and try again for more options." />
          ) : null}

          {!productsQuery.isLoading && !productsQuery.isError && products.length > 0 ? (
            <>
              <ProductGrid
                products={products}
                isInWishlist={isInWishlist}
                onToggleWishlist={(product) => toggle({ id: product.id, slug: product.slug, title: product.title })}
                onQuickAdd={(productId) => addItem.mutate({ item_type: 'product', product_id: productId, quantity: 1 })}
              />

              <div className="mt-6 flex items-center justify-between rounded-xl border border-border bg-surface p-3">
                <button
                  type="button"
                  disabled={filters.page <= 1}
                  onClick={() => patchFilters({ page: Math.max(1, filters.page - 1) })}
                  className="min-h-11 rounded-full border border-border px-4 text-sm disabled:opacity-40"
                >
                  Previous
                </button>
                <p className="text-sm text-muted">Page {filters.page} / {totalPages}</p>
                <button
                  type="button"
                  disabled={filters.page >= totalPages}
                  onClick={() => patchFilters({ page: Math.min(totalPages, filters.page + 1) })}
                  className="min-h-11 rounded-full border border-border px-4 text-sm disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </>
          ) : null}
        </section>
      </div>

      <FilterDrawer open={filterOpen} onClose={closeFilterDrawer}>
        <FilterPanel filters={filters} onPatch={patchFilters} onReset={resetFilters} />
      </FilterDrawer>
    </motion.div>
  );
}
