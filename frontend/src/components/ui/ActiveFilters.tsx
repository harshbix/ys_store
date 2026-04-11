import { X } from 'lucide-react';
import type { ProductFilters } from '../../types/ui';
import { titleCase } from '../../lib/format';
import { Badge } from './badge';
import { Button } from './Button';

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
        <Badge
          key={key}
          variant="secondary"
          className="cursor-pointer gap-1 px-2 py-1 text-xs font-normal"
          onClick={() => onClearOne(key as keyof ProductFilters)}
        >
          {titleCase(key)}: {String(value)}
          <X className="h-3 w-3" />
        </Badge>
      ))}
      <Button variant="outline" size="sm" onClick={onClearAll} className="h-7 text-xs px-2">
        Clear all
      </Button>
    </div>
  );
}
