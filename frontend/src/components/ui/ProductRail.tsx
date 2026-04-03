import { useMemo } from 'react';
import { useCart } from '../../hooks/useCart';
import { useProducts } from '../../hooks/useProducts';
import { useWishlist } from '../../hooks/useWishlist';
import { EmptyState } from '../feedback/EmptyState';
import { ErrorState } from '../feedback/ErrorState';
import { SkeletonCard } from '../feedback/SkeletonCard';
import { ProductCard } from './ProductCard';
import { SectionHeader } from './SectionHeader';
import type { ProductType } from '../../types/api';

type ProductRailProps = {
  title: string;
  subtitle: string;
  type?: ProductType;
  viewAllTo: string;
};

export function ProductRail({ title, subtitle, type, viewAllTo }: ProductRailProps) {
  const query = useProducts({ type, sort: 'newest', page: 1, limit: 8 });
  const { addItem } = useCart();
  const { isInWishlist, toggle } = useWishlist();

  const products = useMemo(() => query.data?.data.items || [], [query.data?.data.items]);

  return (
    <section className="space-y-3">
      <SectionHeader title={title} subtitle={subtitle} viewAllTo={viewAllTo} />

      {query.isLoading ? (
        <div className="flex snap-x gap-3 overflow-x-auto pb-1 md:grid md:grid-cols-4 md:overflow-visible">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={`skeleton-rail-${title}-${index}`} className="min-w-[70%] snap-start md:min-w-0">
              <SkeletonCard />
            </div>
          ))}
        </div>
      ) : null}

      {query.isError ? <ErrorState onRetry={() => query.refetch()} /> : null}

      {!query.isLoading && !query.isError && products.length === 0 ? (
        <EmptyState title="No products currently listed" description="This category is being refreshed. Please check back shortly." />
      ) : null}

      {!query.isLoading && !query.isError && products.length > 0 ? (
        <div className="flex snap-x gap-3 overflow-x-auto pb-1 md:grid md:grid-cols-4 md:overflow-visible">
          {products.map((product) => (
            <div key={product.id} className="min-w-[78%] snap-start sm:min-w-[58%] md:min-w-0">
              <ProductCard
                product={product}
                inWishlist={isInWishlist(product.id)}
                onToggleWishlist={(current) => toggle({ id: current.id, slug: current.slug, title: current.title })}
                onQuickAdd={(productId) => addItem.mutate({ item_type: 'product', product_id: productId, quantity: 1 })}
              />
            </div>
          ))}
        </div>
      ) : null}
    </section>
  );
}
