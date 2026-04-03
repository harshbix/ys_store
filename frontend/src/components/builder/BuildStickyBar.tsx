import { formatTzs } from '../../lib/currency';

type BuildStickyBarProps = {
  total: number;
  onValidate: () => void;
  onAddToCart: () => void;
  validating?: boolean;
  adding?: boolean;
};

export function BuildStickyBar({ total, onValidate, onAddToCart, validating, adding }: BuildStickyBarProps) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-20 border-t border-border bg-background/95 p-3 backdrop-blur lg:hidden">
      <div className="mx-auto flex max-w-7xl items-center gap-2 px-1">
        <div className="min-w-0 flex-1">
          <p className="text-xs text-muted">Estimated Total</p>
          <p className="truncate text-sm font-semibold text-foreground">{formatTzs(total)}</p>
        </div>
        <button
          type="button"
          onClick={onValidate}
          disabled={validating}
          className="min-h-11 rounded-full border border-border px-4 text-xs font-semibold uppercase tracking-wide text-foreground disabled:opacity-40"
        >
          Validate
        </button>
        <button
          type="button"
          onClick={onAddToCart}
          disabled={adding}
          className="min-h-11 rounded-full bg-primary px-4 text-xs font-semibold uppercase tracking-wide text-primaryForeground disabled:opacity-40"
        >
          Add to Cart
        </button>
      </div>
    </div>
  );
}
