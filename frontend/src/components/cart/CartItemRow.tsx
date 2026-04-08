import { m as motion } from 'framer-motion';
import { Trash2 } from 'lucide-react';
import type { CartItem } from '../../types/api';
import { formatTzs } from '../../lib/currency';
import { QuantityStepper } from '../ui/QuantityStepper';

type CartItemRowProps = {
  item: CartItem;
  index?: number;
  busy?: boolean;
  onQuantityChange: (quantity: number) => void;
  onRemove: () => void;
};

export function CartItemRow({ item, index, busy, onQuantityChange, onRemove }: CartItemRowProps) {
  const lineTotal = item.unit_estimated_price_tzs * item.quantity;

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.2 }}
      className="rounded-2xl border border-border bg-surface p-4"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <p className="label-11 text-[10px] uppercase tracking-[0.14em] text-muted">
            Item {String((index || 0) + 1).padStart(2, '0')} • {item.item_type === 'custom_build' ? 'Custom Build' : 'Product'}
          </p>
          <p className="text-[14px] font-semibold leading-5 text-foreground">{item.title_snapshot}</p>
          <p className="font-mono text-[12px] text-secondary">Unit {formatTzs(item.unit_estimated_price_tzs)}</p>
        </div>

        <button
          type="button"
          onClick={onRemove}
          disabled={busy}
          className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border text-secondary transition hover:border-danger hover:text-danger disabled:opacity-40"
          aria-label="Remove item"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      <div className="mt-3 flex items-center justify-between gap-3 border-t border-border/70 pt-3">
        <QuantityStepper value={item.quantity} onChange={onQuantityChange} disabled={busy} />
        <div className="text-right">
          <p className="text-[11px] uppercase tracking-wide text-muted">Line Total</p>
          <p className="font-mono text-[15px] font-semibold text-foreground">{formatTzs(lineTotal)}</p>
        </div>
      </div>
    </motion.article>
  );
}
