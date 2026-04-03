import { formatTzs } from '../../lib/currency';

type PriceDisplayProps = {
  amount: number;
  className?: string;
};

export function PriceDisplay({ amount, className }: PriceDisplayProps) {
  return <p className={className || 'text-base font-semibold text-foreground'}>{formatTzs(amount)}</p>;
}
