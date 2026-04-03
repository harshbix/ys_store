import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import { useUiStore } from '../../store/ui';
import { useCart } from '../../hooks/useCart';
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
            className="fixed inset-y-0 right-0 z-50 w-[420px] max-w-[94vw] overflow-y-auto border-l border-border bg-background p-4"
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-base font-semibold text-foreground">Cart</h2>
              <button onClick={close} type="button" aria-label="Close cart drawer" className="rounded-md border border-border p-2">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3">
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

            <div className="mt-4">
              <CartSummary itemCount={items.length} estimatedTotal={estimatedTotal} />
            </div>
          </motion.aside>
        </>
      ) : null}
    </AnimatePresence>
  );
}
