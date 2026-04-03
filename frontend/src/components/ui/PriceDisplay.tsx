import { formatTzs } from '../../lib/currency';

type PriceDisplayProps = {
  amount: number;
  className?: string;
};

export function PriceDisplay({ amount, className }: PriceDisplayProps) {
  return <p className={className || 'font-mono text-[14px] font-medium text-foreground'}>{formatTzs(amount)}</p>;
}
