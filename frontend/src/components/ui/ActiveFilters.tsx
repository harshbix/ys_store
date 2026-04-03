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
          className="inline-flex min-h-9 items-center gap-1 rounded-full border border-border bg-surface px-3 text-xs font-semibold text-foreground"
        >
          {titleCase(key)}: {String(value)}
          <X className="h-3 w-3" />
        </button>
      ))}
      <button type="button" onClick={onClearAll} className="min-h-9 rounded-full border border-border px-3 text-xs text-muted">
        Clear all
      </button>
    </div>
  );
}
