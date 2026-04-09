import { AnimatePresence, motion } from 'framer-motion';
import { X, Search, AlertCircle } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useComponentsQuery } from '../../hooks/usePCBuilder';
import type { ComponentType, PCComponent } from '../../types/api';
import { formatTzs } from '../../lib/currency';

type BuildPartPickerProps = {
  componentType: ComponentType | null;
  open: boolean;
  onClose: () => void;
  onSelect: (component: PCComponent) => void;
};

function getComponentSpec(component: PCComponent, type: ComponentType): string {
  switch (type) {
    case 'cpu':
      return `${component.cpu_socket} • ${component.cores}C/${component.threads}T`;
    case 'motherboard':
      return `${component.motherboard_socket} • ${component.motherboard_ram_type}`;
    case 'gpu':
      return `${component.vram_gb}GB VRAM`;
    case 'ram':
      return `${component.ram_capacity_gb}GB ${component.ram_type}`;
    case 'psu':
      return `${component.psu_wattage}W`;
    case 'storage':
      return `${component.storage_capacity_gb}GB ${component.storage_type}`;
    case 'cooler':
      return `${component.cooler_type}`;
    default:
      return '';
  }
}

export function BuildPartPicker({ componentType, open, onClose, onSelect }: BuildPartPickerProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const componentsQuery = useComponentsQuery(componentType);

  const components = useMemo(() => componentsQuery.data ?? [], [componentsQuery.data]);
  
  const filtered = useMemo(() => {
    return components.filter(c => 
      c.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [components, searchTerm]);

  return (
    <AnimatePresence>
      {open ? (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-overlay"
            onClick={onClose}
          />
          <motion.section
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ duration: 0.28 }}
            className="fixed inset-x-0 bottom-0 z-50 max-h-[90vh] overflow-hidden rounded-t-2xl border-t border-border bg-background flex flex-col"
            role="dialog"
            aria-modal="true"
            aria-label={`Select ${componentType || 'component'}`}
          >
            {/* Header */}
            <div className="border-b border-border p-4 flex items-center justify-between shrink-0">
              <div>
                <h2 className="text-lg font-bold text-foreground">Select {componentType ? componentType.toUpperCase() : 'Component'}</h2>
                <p className="text-xs text-muted mt-1">{filtered.length} options available</p>
              </div>
              <button 
                onClick={onClose} 
                type="button" 
                className="rounded-lg border border-border p-2 hover:bg-surface transition"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Search */}
            <div className="border-b border-border p-4 shrink-0">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-5 w-5 text-muted pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search components..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-border bg-surface text-foreground placeholder-muted focus:outline-none focus:border-accent"
                />
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto">
              {componentsQuery.isLoading ? (
                <div className="grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-3">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={`skeleton-${i}`} className="h-24 animate-pulse rounded-xl border border-border bg-surface" />
                  ))}
                </div>
              ) : null}

              {componentsQuery.isError ? (
                <div className="p-4">
                  <div className="rounded-lg border border-danger/30 bg-danger/5 p-4 flex gap-3">
                    <AlertCircle className="h-5 w-5 text-danger shrink-0 mt-0.5" />
                    <p className="text-sm text-danger">Failed to load components. Please try again.</p>
                  </div>
                </div>
              ) : null}

              {!componentsQuery.isLoading && filtered.length === 0 ? (
                <div className="p-4">
                  <p className="text-sm text-muted text-center py-8">
                    {searchTerm ? 'No components match your search' : 'No components available'}
                  </p>
                </div>
              ) : null}

              {filtered.length > 0 ? (
                <div className="grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-3">
                  {filtered.map((component) => {
                    const spec = getComponentSpec(component, componentType || 'cpu');
                    return (
                      <button
                        key={component.id}
                        type="button"
                        onClick={() => {
                          onSelect(component);
                          onClose();
                        }}
                        className="rounded-xl border border-border bg-surface p-4 text-left transition hover:border-accent hover:bg-accent/5 active:scale-95"
                      >
                        <div className="space-y-2">
                          <p className="font-semibold text-foreground truncate text-sm">{component.name}</p>
                          {spec && (
                            <p className="text-xs text-muted">{spec}</p>
                          )}
                          <p className="text-sm font-bold text-accent">{formatTzs(component.price_tzs || 0)}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              ) : null}
            </div>
          </motion.section>
        </>
      ) : null}
    </AnimatePresence>
  );
}
