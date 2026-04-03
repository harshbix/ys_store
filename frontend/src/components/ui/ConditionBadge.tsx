import type { ProductCondition } from '../../types/api';
import { titleCase } from '../../lib/format';

const toneMap: Record<ProductCondition, string> = {
  new: 'border-success/40 bg-success/10 text-success',
  imported_used: 'border-border bg-surface text-muted',
  refurbished: 'border-accent/40 bg-accent/10 text-accentSoft',
  custom_build: 'border-accent/40 bg-accent/10 text-accentSoft'
};

type ConditionBadgeProps = {
  condition: ProductCondition;
};

export function ConditionBadge({ condition }: ConditionBadgeProps) {
  return <span className={`inline-flex rounded-full border px-2 py-0.5 text-[11px] font-semibold ${toneMap[condition]}`}>{titleCase(condition)}</span>;
}
