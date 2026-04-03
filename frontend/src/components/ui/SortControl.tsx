type SortControlProps = {
  value: 'price_asc' | 'price_desc' | 'newest';
  onChange: (value: 'price_asc' | 'price_desc' | 'newest') => void;
};

export function SortControl({ value, onChange }: SortControlProps) {
  return (
    <label className="inline-flex items-center gap-2 text-[12px] text-secondary">
      <span className="label-11 text-[11px]">Sort</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value as 'price_asc' | 'price_desc' | 'newest')}
        className="border-b border-border bg-transparent px-0 py-1 text-[12px] text-foreground outline-none"
      >
        <option value="newest">Newest</option>
        <option value="price_asc">Price: Low to High</option>
        <option value="price_desc">Price: High to Low</option>
      </select>
    </label>
  );
}
