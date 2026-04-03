import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import { useUiStore } from '../../store/ui';
import { useCart } from '../../hooks/useCart';
import { ErrorState } from '../feedback/ErrorState';
import { CartItemRow } from './CartItemRow';
import { CartSummary } from './CartSummary';

export function CartDrawer() {
  const isOpen = useUiStore((state) => state.cartDrawerOpen);
  const close = useUiStore((state) => state.closeCartDrawer);
  const { cartQuery, updateItem, removeItem } = useCart();

  const items = cartQuery.data?.data.items || [];
  const estimatedTotal = cartQuery.data?.data.estimated_total_tzs || 0;

  return (
    <AnimatePresence>
      {isOpen ? (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={close}
            className="fixed inset-0 z-40 bg-black/70"
          />
          <motion.aside
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
                <div className="space-y-px bg-border">
                  {items.map((item) => (
                    <CartItemRow
                      key={item.id}
                      item={item}
                      busy={updateItem.isPending || removeItem.isPending}
                      onQuantityChange={(quantity) => updateItem.mutate({ itemId: item.id, quantity })}
                      onRemove={() => removeItem.mutate(item.id)}
                    />
                  ))}
                </div>
              ) : null}
            </div>

            <div className="border-t border-border p-4">
              <CartSummary itemCount={items.length} estimatedTotal={estimatedTotal} />
            </div>
          </motion.aside>
        </>
      ) : null}
    </AnimatePresence>
  );
}
