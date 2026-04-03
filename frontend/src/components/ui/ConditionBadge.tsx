import type { ProductCondition } from '../../types/api';
import { titleCase } from '../../lib/format';

const toneMap: Record<ProductCondition, string> = {
  new: 'text-accent',
  imported_used: 'text-secondary',
  refurbished: 'text-secondary',
  custom_build: 'text-secondary'
};

type ConditionBadgeProps = {
  condition: ProductCondition;
};

export function ConditionBadge({ condition }: ConditionBadgeProps) {
  return (
    <span className={`label-11 inline-flex border border-border bg-background/90 px-2 py-1 text-[10px] font-normal ${toneMap[condition]}`}>
      {titleCase(condition)}
    </span>
  );
}
