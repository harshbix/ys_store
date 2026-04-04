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
  const addingProductId = addItem.isPending ? (addItem.variables?.product_id ?? null) : null;

  const products = useMemo(() => query.data?.data.items || [], [query.data?.data.items]);

  return (
    <section className="space-y-5">
      <SectionHeader title={title} subtitle={subtitle} viewAllTo={viewAllTo} />

      {query.isLoading ? (
        <div className="grid grid-cols-2 gap-px bg-border md:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={`skeleton-rail-${title}-${index}`}>
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
        <div className="grid grid-cols-2 gap-px bg-border md:grid-cols-3 xl:grid-cols-4">
          {products.map((product) => (
            <div key={product.id}>
              <ProductCard
                product={product}
                inWishlist={isInWishlist(product.id)}
                onToggleWishlist={(current) => toggle({ id: current.id, slug: current.slug, title: current.title })}
                onQuickAdd={(productId) => addItem.mutate({ item_type: 'product', product_id: productId, quantity: 1 })}
                addingToCart={addingProductId === product.id}
              />
            </div>
          ))}
        </div>
      ) : null}
    </section>
  );
}
