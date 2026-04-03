type SortControlProps = {
  value: 'price_asc' | 'price_desc' | 'newest';
  onChange: (value: 'price_asc' | 'price_desc' | 'newest') => void;
};

export function SortControl({ value, onChange }: SortControlProps) {
  return (
    <label className="inline-flex min-h-11 items-center gap-2 text-sm text-muted">
      Sort
      <select
        value={value}
        onChange={(event) => onChange(event.target.value as 'price_asc' | 'price_desc' | 'newest')}
        className="min-h-11 rounded-lg border border-border bg-surface px-3 text-sm text-foreground outline-none ring-accent transition focus:ring-2"
      >
        <option value="newest">Newest</option>
        <option value="price_asc">Price: Low to High</option>
        <option value="price_desc">Price: High to Low</option>
      </select>
    </label>
  );
}
