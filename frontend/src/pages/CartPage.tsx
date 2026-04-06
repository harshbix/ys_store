import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { CartItemRow } from '../components/cart/CartItemRow';
import { CartSummary } from '../components/cart/CartSummary';
import { EmptyState } from '../components/feedback/EmptyState';
import { ErrorState } from '../components/feedback/ErrorState';
import { SkeletonGrid } from '../components/feedback/SkeletonGrid';
import { useCart } from '../hooks/useCart';
import { useAuthStore } from '../store/auth';

export default function CartPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const isAuthenticated = useAuthStore((state) => Boolean(state.accessToken && state.customerId));
  const { cartQuery, updateItem, removeItem } = useCart();

  useEffect(() => {
    if (isAuthenticated) return;
    navigate('/login', {
      replace: true,
      state: {
        from: location.pathname,
        returnTo: '/cart'
      }
    });
  }, [isAuthenticated, location.pathname, navigate]);

  if (!isAuthenticated) {
    return <SkeletonGrid count={2} />;
  }

  const items = cartQuery.data?.items ?? cartQuery.data?.data?.items ?? [];
  const total = cartQuery.data?.estimated_total_tzs ?? cartQuery.data?.data?.estimated_total_tzs ?? 0;

  return (
    <div className="space-y-6 pb-8">
      <header>
        <h1 className="section-title text-foreground">Your Cart</h1>
        <p className="mt-2 text-[13px] text-secondary">Review quantities, adjust items, then continue to quote checkout.</p>
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
          <section className="space-y-3">
            {items.map((item, index) => (
              <CartItemRow
                key={item.id}
                item={item}
                index={index}
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
