import type { ProductFilters } from '../../types/ui';

type FilterPanelProps = {
  filters: ProductFilters;
  onPatch: (next: Partial<ProductFilters>) => void;
  onReset: () => void;
};

export function FilterPanel({ filters, onPatch, onReset }: FilterPanelProps) {
  return (
    <div className="space-y-4 rounded-2xl border border-border bg-surface p-4">
      <div>
        <p className="mb-2 text-xs uppercase tracking-wider text-muted">Type</p>
        <select
          value={filters.type || ''}
          onChange={(event) => onPatch({ type: (event.target.value || undefined) as ProductFilters['type'], page: 1 })}
          className="min-h-11 w-full rounded-lg border border-border bg-background px-3 text-sm"
        >
          <option value="">All Types</option>
          <option value="desktop">Desktops</option>
          <option value="laptop">Laptops</option>
          <option value="component">Components</option>
          <option value="accessory">Accessories</option>
        </select>
      </div>

      <div>
        <p className="mb-2 text-xs uppercase tracking-wider text-muted">Condition</p>
        <select
          value={filters.condition || ''}
          onChange={(event) => onPatch({ condition: (event.target.value || undefined) as ProductFilters['condition'], page: 1 })}
          className="min-h-11 w-full rounded-lg border border-border bg-background px-3 text-sm"
        >
          <option value="">Any Condition</option>
          <option value="new">New</option>
          <option value="imported_used">Imported Used</option>
          <option value="refurbished">Refurbished</option>
          <option value="custom_build">Custom Build</option>
        </select>
      </div>

      <div>
        <p className="mb-2 text-xs uppercase tracking-wider text-muted">Stock</p>
        <select
          value={filters.stock_status || ''}
          onChange={(event) => onPatch({ stock_status: (event.target.value || undefined) as ProductFilters['stock_status'], page: 1 })}
          className="min-h-11 w-full rounded-lg border border-border bg-background px-3 text-sm"
        >
          <option value="">Any Stock</option>
          <option value="in_stock">In Stock</option>
          <option value="low_stock">Low Stock</option>
          <option value="build_on_request">Build On Request</option>
          <option value="incoming_stock">Incoming Stock</option>
          <option value="sold_out">Sold Out</option>
        </select>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <label className="text-xs text-muted">
          Min Price
          <input
            type="number"
            min={0}
            value={filters.min_price ?? ''}
            onChange={(event) => onPatch({ min_price: event.target.value ? Number(event.target.value) : undefined, page: 1 })}
            className="mt-1 min-h-11 w-full rounded-lg border border-border bg-background px-3 text-sm"
          />
        </label>
        <label className="text-xs text-muted">
          Max Price
          <input
            type="number"
            min={0}
            value={filters.max_price ?? ''}
            onChange={(event) => onPatch({ max_price: event.target.value ? Number(event.target.value) : undefined, page: 1 })}
            className="mt-1 min-h-11 w-full rounded-lg border border-border bg-background px-3 text-sm"
          />
        </label>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <label className="text-xs text-muted">
          RAM (GB)
          <input
            type="number"
            min={0}
            value={filters.ram_gb ?? ''}
            onChange={(event) => onPatch({ ram_gb: event.target.value ? Number(event.target.value) : undefined, page: 1 })}
            className="mt-1 min-h-11 w-full rounded-lg border border-border bg-background px-3 text-sm"
          />
        </label>
        <label className="text-xs text-muted">
          Storage (GB)
          <input
            type="number"
            min={0}
            value={filters.storage_gb ?? ''}
            onChange={(event) => onPatch({ storage_gb: event.target.value ? Number(event.target.value) : undefined, page: 1 })}
            className="mt-1 min-h-11 w-full rounded-lg border border-border bg-background px-3 text-sm"
          />
        </label>
      </div>

      <label className="text-xs text-muted">
        Brand
        <input
          type="text"
          value={filters.brand || ''}
          onChange={(event) => onPatch({ brand: event.target.value || undefined, page: 1 })}
          className="mt-1 min-h-11 w-full rounded-lg border border-border bg-background px-3 text-sm"
        />
      </label>

      <button
        type="button"
        onClick={onReset}
        className="min-h-11 w-full rounded-full border border-border text-sm text-muted transition hover:border-accent hover:text-accent"
      >
        Reset Filters
      </button>
    </div>
  );
}
