import { SlidersHorizontal } from 'lucide-react';
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
    if (filters.type) return `${filters.type.charAt(0).toUpperCase()}${filters.type.slice(1)}`;
    return 'Catalog';
  }, [filters.type]);

  const pageItems = useMemo(() => {
    const maxVisible = 7;
    const start = Math.max(1, filters.page - Math.floor(maxVisible / 2));
    const end = Math.min(totalPages, start + maxVisible - 1);
    const normalizedStart = Math.max(1, end - maxVisible + 1);
    return Array.from({ length: end - normalizedStart + 1 }, (_, index) => normalizedStart + index);
  }, [filters.page, totalPages]);

  const patchFilters = (patch: Partial<ProductFilters>) => {
    setSearchParams(writeFilters(filters, patch));
  };

  const resetFilters = () => {
    setSearchParams(new URLSearchParams({ page: '1', limit: String(filters.limit), sort: 'newest' }));
  };

  return (
    <div className="space-y-6 pb-8 md:space-y-8">
      <header className="space-y-4 border-b border-border pb-4">
        <div className="flex items-end justify-between gap-3">
          <div>
            <h1 className="section-title text-foreground">{title}</h1>
            <p className="mt-2 text-[12px] text-secondary">{total} results</p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={openFilterDrawer}
              className="inline-flex h-8 items-center gap-2 border border-border px-3 text-[12px] text-secondary lg:hidden"
            >
              <SlidersHorizontal className="h-4 w-4" />
              Filters
            </button>
            <SortControl value={filters.sort} onChange={(value) => patchFilters({ sort: value, page: 1 })} />
          </div>
        </div>

        <ActiveFilters filters={filters} onClearOne={(key) => patchFilters({ [key]: undefined, page: 1 })} onClearAll={resetFilters} />
      </header>

      <div className="grid gap-6 lg:grid-cols-[220px_1fr]">
        <aside className="hidden lg:sticky lg:top-[72px] lg:block lg:self-start">
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

              <div className="mt-8 flex items-center justify-center gap-3 text-[12px] text-secondary">
                <button
                  type="button"
                  disabled={filters.page <= 1}
                  onClick={() => patchFilters({ page: Math.max(1, filters.page - 1) })}
                  className="h-8 border border-border px-3 disabled:opacity-40"
                >
                  Previous
                </button>

                {pageItems.map((page) => (
                  <button
                    key={page}
                    type="button"
                    onClick={() => patchFilters({ page })}
                    className={`h-8 min-w-8 px-2 ${page === filters.page ? 'border-b border-foreground text-foreground' : 'text-secondary'}`}
                  >
                    {page}
                  </button>
                ))}

                <button
                  type="button"
                  disabled={filters.page >= totalPages}
                  onClick={() => patchFilters({ page: Math.min(totalPages, filters.page + 1) })}
                  className="h-8 border border-border px-3 disabled:opacity-40"
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
    </div>
  );
}
