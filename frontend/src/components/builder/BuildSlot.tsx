import { Loader2, PlusCircle, Trash2 } from 'lucide-react';
import type { BuildItem, ComponentType } from '../../types/api';
import { formatTzs } from '../../lib/currency';

type BuildSlotProps = {
  componentType: ComponentType;
  label: string;
  helper: string;
  item?: BuildItem;
  pending?: boolean;
  onPick: () => void;
  onRemove: (itemId: string) => void;
};

export function BuildSlot({ componentType, label, helper, item, pending, onPick, onRemove }: BuildSlotProps) {
  return (
    <article className="rounded-2xl border border-border bg-surface p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-wide text-muted">{componentType}</p>
          <h3 className="text-base font-semibold text-foreground">{label}</h3>
          <p className="mt-1 text-xs text-muted">{helper}</p>
        </div>

        <button
          type="button"
          onClick={onPick}
          className="inline-flex min-h-11 items-center gap-1 rounded-full border border-border px-4 text-xs font-semibold uppercase tracking-wide text-foreground transition hover:border-accent hover:text-accent"
        >
          {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <PlusCircle className="h-4 w-4" />}
          {item ? 'Replace' : 'Select'}
        </button>
      </div>

      {item ? (
        <div className="mt-4 rounded-xl border border-border bg-background p-3">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-sm font-semibold text-foreground">{item.products?.title || 'Selected component'}</p>
              <p className="mt-1 text-xs text-muted">{formatTzs(item.unit_estimated_price_tzs)}</p>
            </div>
            <button
              type="button"
              onClick={() => onRemove(item.id)}
              className="inline-flex min-h-10 min-w-10 items-center justify-center rounded-md border border-border text-muted hover:text-danger"
              aria-label={`Remove ${label}`}
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>
      ) : (
        <p className="mt-4 rounded-xl border border-dashed border-border p-3 text-sm text-muted">No component selected yet.</p>
      )}
    </article>
  );
}
