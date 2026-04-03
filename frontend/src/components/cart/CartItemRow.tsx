import { Trash2 } from 'lucide-react';
import type { CartItem } from '../../types/api';
import { formatTzs } from '../../lib/currency';
import { QuantityStepper } from '../ui/QuantityStepper';

type CartItemRowProps = {
  item: CartItem;
  busy?: boolean;
  onQuantityChange: (quantity: number) => void;
  onRemove: () => void;
};

export function CartItemRow({ item, busy, onQuantityChange, onRemove }: CartItemRowProps) {
  return (
    <article className="bg-surface p-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-[13px] font-normal text-foreground">{item.title_snapshot}</p>
          <p className="label-11 mt-1 text-[10px] text-muted">{item.item_type === 'custom_build' ? 'Custom Build' : 'Product'}</p>
          <p className="mt-2 font-mono text-[14px] font-medium text-foreground">{formatTzs(item.unit_estimated_price_tzs)}</p>
        </div>

        <button
          type="button"
          onClick={onRemove}
          disabled={busy}
          className="inline-flex h-8 w-8 items-center justify-center border border-border text-secondary transition hover:text-danger disabled:opacity-40"
          aria-label="Remove item"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      <div className="mt-3 flex items-center justify-between">
        <QuantityStepper value={item.quantity} onChange={onQuantityChange} disabled={busy} />
        <p className="font-mono text-[14px] font-medium">{formatTzs(item.unit_estimated_price_tzs * item.quantity)}</p>
      </div>
    </article>
  );
}
