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
    <aside className="rounded-2xl border border-border bg-surface p-5">
      <h2 className="text-base font-semibold text-foreground">Order Summary</h2>

      <dl className="mt-4 space-y-3 text-sm">
        <div className="flex items-center justify-between text-muted">
          <dt>Items</dt>
          <dd>{itemCount}</dd>
        </div>
        <div className="flex items-center justify-between text-foreground">
          <dt className="font-semibold">Estimated Total</dt>
          <dd className="font-semibold">{formatTzs(estimatedTotal)}</dd>
        </div>
      </dl>

      <Link
        to={ctaHref}
        className="mt-5 inline-flex min-h-11 w-full items-center justify-center rounded-full bg-primary px-5 text-sm font-semibold text-primaryForeground"
      >
        {ctaLabel}
      </Link>
    </aside>
  );
}
