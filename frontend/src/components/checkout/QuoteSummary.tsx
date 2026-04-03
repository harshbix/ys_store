import type { CartPayload } from '../../types/api';
import { formatTzs } from '../../lib/currency';

type QuoteSummaryProps = {
  cart: CartPayload;
};

export function QuoteSummary({ cart }: QuoteSummaryProps) {
  return (
    <section className="rounded-2xl border border-border bg-surface p-5">
      <h2 className="text-base font-semibold text-foreground">Cart Review</h2>
      <div className="mt-4 space-y-3">
        {cart.items.map((item) => (
          <article key={item.id} className="flex items-start justify-between gap-3 rounded-lg border border-border bg-background p-3 text-sm">
            <div>
              <p className="font-medium text-foreground">{item.title_snapshot}</p>
              <p className="text-xs text-muted">Qty {item.quantity}</p>
            </div>
            <p className="font-semibold text-foreground">{formatTzs(item.unit_estimated_price_tzs * item.quantity)}</p>
          </article>
        ))}
      </div>
      <div className="mt-4 flex items-center justify-between border-t border-border pt-3 text-sm">
        <p className="font-semibold text-foreground">Estimated Total</p>
        <p className="font-semibold text-foreground">{formatTzs(cart.estimated_total_tzs)}</p>
      </div>
    </section>
  );
}
