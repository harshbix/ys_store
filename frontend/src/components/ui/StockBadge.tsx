import type { StockStatus } from '../../types/api';
import { titleCase } from '../../lib/format';

const statusTone: Record<StockStatus, string> = {
  in_stock: 'border-success/40 bg-success/10 text-success',
  low_stock: 'border-accent/40 bg-accent/10 text-accentSoft',
  build_on_request: 'border-border bg-surface text-muted',
  incoming_stock: 'border-border bg-surface text-muted',
  sold_out: 'border-danger/40 bg-danger/10 text-danger'
};

type StockBadgeProps = {
  stockStatus: StockStatus;
};

export function StockBadge({ stockStatus }: StockBadgeProps) {
  if (stockStatus === 'in_stock') {
    return <span className={`inline-flex rounded-full border px-2 py-0.5 text-[11px] font-semibold ${statusTone[stockStatus]}`}>In Stock</span>;
  }

  return <span className={`inline-flex rounded-full border px-2 py-0.5 text-[11px] font-semibold ${statusTone[stockStatus]}`}>{titleCase(stockStatus)}</span>;
}
