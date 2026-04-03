import { Search, X } from 'lucide-react';
import { useEffect, useState } from 'react';

type SearchInputProps = {
  value?: string;
  placeholder?: string;
  onDebouncedChange: (value: string) => void;
  debounceMs?: number;
};

export function SearchInput({ value = '', placeholder = 'Search products by brand or model', onDebouncedChange, debounceMs = 280 }: SearchInputProps) {
  const [internal, setInternal] = useState(value);

  useEffect(() => {
    setInternal(value);
  }, [value]);

  useEffect(() => {
    const timer = window.setTimeout(() => onDebouncedChange(internal.trim()), debounceMs);
    return () => window.clearTimeout(timer);
  }, [debounceMs, internal, onDebouncedChange]);

  return (
    <label className="relative block">
      <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-muted" />
      <input
        value={internal}
        onChange={(event) => setInternal(event.target.value)}
        placeholder={placeholder}
        className="min-h-11 w-full rounded-lg border border-border bg-surface px-9 text-sm text-foreground outline-none ring-accent transition focus:ring-2"
      />
      {internal ? (
        <button
          type="button"
          onClick={() => setInternal('')}
          className="absolute right-2 top-2 inline-flex min-h-8 min-w-8 items-center justify-center rounded-md text-muted hover:bg-surfaceElevated"
          aria-label="Clear search"
        >
          <X className="h-4 w-4" />
        </button>
      ) : null}
    </label>
  );
}
