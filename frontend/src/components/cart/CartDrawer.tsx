import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useUiStore } from '../../store/ui';
import { useEscapeKey } from '../../hooks/useEscapeKey';
import { useFocusTrap } from '../../hooks/useFocusTrap';
import { useCart } from '../../hooks/useCart';
import { ErrorState } from '../feedback/ErrorState';
import { CartItemRow } from './CartItemRow';
import { CartSummary } from './CartSummary';
import { useRef } from 'react';

export function CartDrawer() {
  const isOpen = useUiStore((state) => state.cartDrawerOpen);
  const close = useUiStore((state) => state.closeCartDrawer);
  const { cartQuery, updateItem, removeItem } = useCart();
  const containerRef = useRef<HTMLDivElement>(null);

  useEscapeKey(close, isOpen);
  useFocusTrap(containerRef, isOpen);

  const items = cartQuery.isSuccess ? (cartQuery.data?.items ?? []) : [];
  const estimatedTotal = cartQuery.isSuccess ? (cartQuery.data?.estimated_total_tzs ?? 0) : 0;

  return (
    <AnimatePresence>
      {isOpen ? (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={close}
            className="fixed inset-0 z-40 bg-overlay/70"
          />
          <motion.aside id="cart-drawer" ref={containerRef as any} aria-label="Your Cart"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ duration: 0.28 }}
            className="fixed inset-y-0 right-0 z-50 flex h-full w-full flex-col border-l border-border bg-background md:w-[400px]"
          >
            <div className="flex h-[52px] items-center justify-between border-b border-border px-4">
              <h2 className="text-[13px] font-normal text-foreground">Cart</h2>
              <button onClick={close} type="button" aria-label="Close cart drawer" className="inline-flex h-9 w-9 items-center justify-center text-secondary">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              {cartQuery.isLoading ? (
                <div className="space-y-2">
                  {Array.from({ length: 3 }).map((_, index) => (
                    <div key={`cart-skeleton-${index}`} className="h-20 animate-pulse rounded-xl border border-border bg-surface" />
                  ))}
                </div>
              ) : null}

              {cartQuery.isError ? (
                <ErrorState
                  title="Cart unavailable"
                  description="Could not load cart right now."
                  onRetry={() => cartQuery.refetch()}
                />
              ) : null}

              {!cartQuery.isLoading && !cartQuery.isError ? (
                <div className="space-y-3">
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

                  {items.length === 0 ? (
                    <div className="rounded-xl border border-border bg-surface p-4 text-center">
                      <p className="text-sm font-semibold text-foreground">Your cart is empty</p>
                      <p className="mt-1 text-xs text-secondary">Browse products and add what you want to quote.</p>
                      <Link
                        to="/shop"
                        onClick={close}
                        className="mt-3 inline-flex min-h-10 items-center rounded-full border border-border px-4 text-xs font-semibold text-foreground"
                      >
                        Browse Shop
                      </Link>
                    </div>
                  ) : null}
                </div>
              ) : null}
            </div>

            <div className="border-t border-border p-4">
              <CartSummary itemCount={items.length} estimatedTotal={estimatedTotal} hasCustomBuild={items.some(i => i.item_type === 'custom_build')} />
            </div>
          </motion.aside>
        </>
      ) : null}
    </AnimatePresence>
  );
}
