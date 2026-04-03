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
    <aside className="bg-surface p-4">
      <h2 className="label-11 text-secondary">Order Summary</h2>

      <dl className="mt-4 space-y-2 text-[13px]">
        <div className="flex items-center justify-between text-secondary">
          <dt>Items</dt>
          <dd>{itemCount}</dd>
        </div>
        <div className="flex items-center justify-between text-foreground">
          <dt className="font-medium">Estimated Total</dt>
          <dd className="font-mono text-[14px] font-medium">{formatTzs(estimatedTotal)}</dd>
        </div>
      </dl>

      <Link
        to={ctaHref}
        className="mt-5 inline-flex h-12 w-full items-center justify-center bg-primary px-5 text-[13px] font-medium text-primaryForeground"
      >
        {ctaLabel}
      </Link>
    </aside>
  );
}
