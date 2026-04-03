import type { ProductFilters } from '../../types/ui';

type FilterPanelProps = {
  filters: ProductFilters;
  onPatch: (next: Partial<ProductFilters>) => void;
  onReset: () => void;
};

export function FilterPanel({ filters, onPatch, onReset }: FilterPanelProps) {
  const typeOptions: Array<{ value: NonNullable<ProductFilters['type']>; label: string }> = [
    { value: 'desktop', label: 'Desktops' },
    { value: 'laptop', label: 'Laptops' },
    { value: 'component', label: 'Parts' },
    { value: 'accessory', label: 'Accessories' }
  ];

  const conditionOptions: Array<{ value: NonNullable<ProductFilters['condition']>; label: string }> = [
    { value: 'new', label: 'New' },
    { value: 'imported_used', label: 'Imported Used' },
    { value: 'refurbished', label: 'Refurbished' },
    { value: 'custom_build', label: 'Custom Build' }
  ];

  const stockOptions: Array<{ value: NonNullable<ProductFilters['stock_status']>; label: string }> = [
    { value: 'in_stock', label: 'In Stock' },
    { value: 'low_stock', label: 'Low Stock' },
    { value: 'build_on_request', label: 'Build On Request' },
    { value: 'incoming_stock', label: 'Incoming Stock' },
    { value: 'sold_out', label: 'Sold Out' }
  ];

  const brandQuickOptions = ['ASUS', 'MSI', 'Dell', 'Lenovo', 'HP', 'Aorus'];
  const ramOptions = [8, 16, 32, 64];
  const storageOptions = [256, 512, 1000, 2000];

  const minBound = 100000;
  const maxBound = 10000000;
  const minPrice = filters.min_price ?? 500000;
  const maxPrice = filters.max_price ?? 5000000;

  const checkClass = 'h-[14px] w-[14px] appearance-none border border-border bg-background checked:border-accent checked:bg-accent focus:outline-none';

  const toggleSingle = <T extends string | number>(key: keyof ProductFilters, current: T | undefined, next: T) => {
    onPatch({ [key]: current === next ? undefined : next, page: 1 });
  };

  return (
    <div className="space-y-4 text-[13px] text-secondary">
      <section className="space-y-3 border-b border-border pb-4">
        <p className="label-11 text-secondary">Type</p>
        <div className="space-y-2">
          {typeOptions.map((option) => (
            <label key={option.value} className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={filters.type === option.value}
                onChange={() => toggleSingle('type', filters.type, option.value)}
                className={checkClass}
              />
              <span>{option.label}</span>
            </label>
          ))}
        </div>
      </section>

      <section className="space-y-3 border-b border-border pb-4">
        <p className="label-11 text-secondary">Brand</p>
        <input
          type="text"
          value={filters.brand || ''}
          onChange={(event) => onPatch({ brand: event.target.value || undefined, page: 1 })}
          placeholder="Search brand"
          className="h-9 w-full border border-border bg-background px-2 text-[13px] text-foreground placeholder:text-muted"
        />
        <div className="grid grid-cols-2 gap-y-2">
          {brandQuickOptions.map((brand) => (
            <label key={brand} className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={filters.brand?.toLowerCase() === brand.toLowerCase()}
                onChange={() => toggleSingle('brand', filters.brand, brand)}
                className={checkClass}
              />
              <span>{brand}</span>
            </label>
          ))}
        </div>
      </section>

      <section className="space-y-3 border-b border-border pb-4">
        <p className="label-11 text-secondary">Condition</p>
        <div className="space-y-2">
          {conditionOptions.map((option) => (
            <label key={option.value} className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={filters.condition === option.value}
                onChange={() => toggleSingle('condition', filters.condition, option.value)}
                className={checkClass}
              />
              <span>{option.label}</span>
            </label>
          ))}
        </div>
      </section>

      <section className="space-y-3 border-b border-border pb-4">
        <p className="label-11 text-secondary">Price</p>
        <div className="space-y-3">
          <input
            type="range"
            min={minBound}
            max={maxBound}
            step={50000}
            value={minPrice}
            onChange={(event) => {
              const next = Number(event.target.value);
              onPatch({ min_price: Math.min(next, maxPrice), page: 1 });
            }}
            className="w-full accent-accent"
          />
          <input
            type="range"
            min={minBound}
            max={maxBound}
            step={50000}
            value={maxPrice}
            onChange={(event) => {
              const next = Number(event.target.value);
              onPatch({ max_price: Math.max(next, minPrice), page: 1 });
            }}
            className="w-full accent-accent"
          />
          <div className="grid grid-cols-2 gap-2">
            <input
              type="number"
              value={minPrice}
              min={minBound}
              max={maxPrice}
              onChange={(event) => onPatch({ min_price: Number(event.target.value) || undefined, page: 1 })}
              className="h-9 border border-border bg-background px-2 text-[13px] text-foreground"
            />
            <input
              type="number"
              value={maxPrice}
              min={minPrice}
              max={maxBound}
              onChange={(event) => onPatch({ max_price: Number(event.target.value) || undefined, page: 1 })}
              className="h-9 border border-border bg-background px-2 text-[13px] text-foreground"
            />
          </div>
        </div>
      </section>

      <section className="space-y-3 border-b border-border pb-4">
        <p className="label-11 text-secondary">CPU</p>
        <input
          type="text"
          value={filters.cpu || ''}
          onChange={(event) => onPatch({ cpu: event.target.value || undefined, page: 1 })}
          placeholder="e.g. i7, Ryzen"
          className="h-9 w-full border border-border bg-background px-2 text-[13px] text-foreground placeholder:text-muted"
        />
      </section>

      <section className="space-y-3 border-b border-border pb-4">
        <p className="label-11 text-secondary">GPU</p>
        <input
          type="text"
          value={filters.gpu || ''}
          onChange={(event) => onPatch({ gpu: event.target.value || undefined, page: 1 })}
          placeholder="e.g. RTX 4070"
          className="h-9 w-full border border-border bg-background px-2 text-[13px] text-foreground placeholder:text-muted"
        />
      </section>

      <section className="space-y-3 border-b border-border pb-4">
        <p className="label-11 text-secondary">RAM</p>
        <div className="grid grid-cols-2 gap-y-2">
          {ramOptions.map((ram) => (
            <label key={ram} className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={filters.ram_gb === ram}
                onChange={() => toggleSingle('ram_gb', filters.ram_gb, ram)}
                className={checkClass}
              />
              <span>{ram} GB</span>
            </label>
          ))}
        </div>
      </section>

      <section className="space-y-3 border-b border-border pb-4">
        <p className="label-11 text-secondary">Storage</p>
        <div className="grid grid-cols-2 gap-y-2">
          {storageOptions.map((storage) => (
            <label key={storage} className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={filters.storage_gb === storage}
                onChange={() => toggleSingle('storage_gb', filters.storage_gb, storage)}
                className={checkClass}
              />
              <span>{storage >= 1000 ? `${storage / 1000} TB` : `${storage} GB`}</span>
            </label>
          ))}
        </div>
      </section>

      <section className="space-y-3 pb-2">
        <p className="label-11 text-secondary">Stock</p>
        <div className="space-y-2">
          {stockOptions.map((option) => (
            <label key={option.value} className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={filters.stock_status === option.value}
                onChange={() => toggleSingle('stock_status', filters.stock_status, option.value)}
                className={checkClass}
              />
              <span>{option.label}</span>
            </label>
          ))}
        </div>
      </section>

      <button type="button" onClick={onReset} className="mt-1 h-10 border border-border px-3 text-[13px] text-secondary transition hover:text-foreground">
        Reset Filters
      </button>
    </div>
  );
}
