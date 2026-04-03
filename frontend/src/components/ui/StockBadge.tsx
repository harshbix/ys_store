import type { StockStatus } from '../../types/api';
import { titleCase } from '../../lib/format';

const statusTone: Record<StockStatus, string> = {
  in_stock: 'text-success',
  low_stock: 'text-accent',
  build_on_request: 'text-secondary',
  incoming_stock: 'text-secondary',
  sold_out: 'text-danger'
};

type StockBadgeProps = {
  stockStatus: StockStatus;
};

export function StockBadge({ stockStatus }: StockBadgeProps) {
  const text = stockStatus === 'in_stock' ? 'In Stock' : titleCase(stockStatus);
  return (
    <span className={`label-11 inline-flex border border-border bg-background px-2 py-1 text-[10px] font-normal ${statusTone[stockStatus]}`}>
      {text}
    </span>
  );
}
