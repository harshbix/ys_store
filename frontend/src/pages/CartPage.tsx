import { CartItemRow } from '../components/cart/CartItemRow';
import { CartSummary } from '../components/cart/CartSummary';
import { EmptyState } from '../components/feedback/EmptyState';
import { ErrorState } from '../components/feedback/ErrorState';
import { SkeletonGrid } from '../components/feedback/SkeletonGrid';
import { useCart } from '../hooks/useCart';

export default function CartPage() {
  const { cartQuery, updateItem, removeItem } = useCart();

  const items = cartQuery.data?.data.items || [];
  const total = cartQuery.data?.data.estimated_total_tzs || 0;

  return (
    <div className="space-y-6 pb-8">
      <header>
        <h1 className="section-title text-foreground">Cart</h1>
        <p className="mt-2 text-[13px] text-secondary">Backend cart is the source of truth for your current session.</p>
      </header>

      {cartQuery.isLoading ? <SkeletonGrid count={4} /> : null}
      {cartQuery.isError ? <ErrorState onRetry={() => cartQuery.refetch()} /> : null}

      {!cartQuery.isLoading && !cartQuery.isError && items.length === 0 ? (
        <EmptyState
          title="Your cart is empty"
          description="Add products or a custom build to continue to quote checkout."
          actionLabel="Browse Shop"
          actionHref="/shop"
        />
      ) : null}

      {!cartQuery.isLoading && !cartQuery.isError && items.length > 0 ? (
        <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
          <section className="space-y-px bg-border">
            {items.map((item) => (
              <CartItemRow
                key={item.id}
                item={item}
                busy={updateItem.isPending || removeItem.isPending}
                onQuantityChange={(quantity) => updateItem.mutate({ itemId: item.id, quantity })}
                onRemove={() => removeItem.mutate(item.id)}
              />
            ))}
          </section>
          <aside className="lg:sticky lg:top-20 lg:self-start">
            <CartSummary itemCount={items.length} estimatedTotal={total} />
          </aside>
        </div>
      ) : null}
    </div>
  );
}
