import { X } from 'lucide-react';
import type { ProductFilters } from '../../types/ui';
import { titleCase } from '../../lib/format';

type ActiveFiltersProps = {
  filters: Partial<ProductFilters>;
  onClearOne: (key: keyof ProductFilters) => void;
  onClearAll: () => void;
};

export function ActiveFilters({ filters, onClearOne, onClearAll }: ActiveFiltersProps) {
  const entries = Object.entries(filters).filter(([key, value]) => {
    if (['page', 'limit', 'sort'].includes(key)) return false;
    if (value === undefined || value === null || value === '') return false;
    return true;
  });

  if (!entries.length) return null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      {entries.map(([key, value]) => (
        <button
          key={key}
          type="button"
          onClick={() => onClearOne(key as keyof ProductFilters)}
          className="inline-flex min-h-7 items-center gap-1 rounded-[2px] border border-border bg-surface px-2 text-[11px] font-normal text-secondary"
        >
          {titleCase(key)}: {String(value)}
          <X className="h-3 w-3" />
        </button>
      ))}
      <button type="button" onClick={onClearAll} className="min-h-7 rounded-[2px] border border-border px-2 text-[11px] text-secondary">
        Clear all
      </button>
    </div>
  );
}
