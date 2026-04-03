import { Link } from 'react-router-dom';
import { formatTzs } from '../../lib/currency';

type CartSummaryProps = {
  itemCount: number;
  estimatedTotal: number;
  ctaHref?: string;
  ctaLabel?: string;
};

export function CartSummary({ itemCount, estimatedTotal, ctaHref = '/checkout', ctaLabel = 'Proceed to Quote' }: CartSummaryProps) {
  return (
    <aside className="space-y-4 rounded-2xl border border-border bg-surface p-4">
      <div>
        <h2 className="label-11 text-secondary">Order Summary</h2>
        <p className="mt-1 text-xs text-muted">A quote specialist will confirm final pricing and availability.</p>
      </div>

      <dl className="space-y-2 text-[13px]">
        <div className="flex items-center justify-between text-secondary">
          <dt>Items in cart</dt>
          <dd>{itemCount}</dd>
        </div>
        <div className="flex items-center justify-between text-secondary">
          <dt>Service fee</dt>
          <dd>Included</dd>
        </div>
        <div className="flex items-center justify-between border-t border-border pt-2 text-foreground">
          <dt className="font-semibold">Estimated Total</dt>
          <dd className="font-mono text-[16px] font-semibold">{formatTzs(estimatedTotal)}</dd>
        </div>
      </dl>

      <Link
        to={ctaHref}
        className="inline-flex h-12 w-full items-center justify-center rounded-full bg-primary px-5 text-[13px] font-semibold text-primaryForeground"
      >
        {ctaLabel}
      </Link>
    </aside>
  );
}
