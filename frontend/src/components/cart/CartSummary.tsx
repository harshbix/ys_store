import { Link } from 'react-router-dom';
import { formatTzs } from '../../lib/currency';
import { useAuthStore } from '../../store/auth';

type CartSummaryProps = {
  itemCount: number;
  estimatedTotal: number;
  hasCustomBuild?: boolean;
  ctaHref?: string;
  ctaLabel?: string;
};

export function CartSummary({ itemCount, estimatedTotal, hasCustomBuild = false, ctaHref = '/checkout', ctaLabel = 'Proceed to Quote' }: CartSummaryProps) {
  const isAuthenticated = useAuthStore((state) => Boolean(state.accessToken && state.customerId));
  const resolvedHref = isAuthenticated ? ctaHref : '/login';
  const resolvedLabel = isAuthenticated ? ctaLabel : 'Sign In to Continue';

  const buildingFee = hasCustomBuild ? 50000 : 0;
  const finalTotal = estimatedTotal + buildingFee;

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
          <dt>Parts Subtotal</dt>
          <dd>{formatTzs(estimatedTotal)}</dd>
        </div>
        <div className="flex items-center justify-between text-secondary">
          <dt>Service fee</dt>
          <dd className={buildingFee > 0 ? 'text-foreground font-medium' : ''}>{buildingFee > 0 ? formatTzs(buildingFee) : 'Included'}</dd>
        </div>
        <div className="flex items-center justify-between border-t border-border pt-2 text-foreground">
          <dt className="font-semibold">Estimated Total</dt>
          <dd className="font-mono text-[16px] font-semibold">{formatTzs(finalTotal)}</dd>
        </div>
      </dl>

      <Link
        to={resolvedHref}
        state={isAuthenticated ? undefined : { from: '/cart', returnTo: '/cart' }}
        className="inline-flex h-12 w-full items-center justify-center rounded-full bg-primary px-5 text-[13px] font-semibold text-primaryForeground"
      >
        {resolvedLabel}
      </Link>
    </aside>
  );
}
