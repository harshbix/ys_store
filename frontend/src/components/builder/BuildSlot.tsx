import { Loader2, Cpu, HardDrive, Zap, Box, Wind, Monitor } from 'lucide-react';
import type { BuildItem, ComponentType } from '../../types/api';
import { formatTzs } from '../../lib/currency';

const componentIcons: Record<ComponentType, React.ReactNode> = {
  cpu: <Cpu className="h-5 w-5" />,
  motherboard: <Box className="h-5 w-5" />,
  gpu: <Monitor className="h-5 w-5" />,
  ram: <HardDrive className="h-5 w-5" />,
  storage: <HardDrive className="h-5 w-5" />,
  psu: <Zap className="h-5 w-5" />,
  case: <Box className="h-5 w-5" />,
  cooler: <Wind className="h-5 w-5" />
};

type BuildSlotProps = {
  componentType: ComponentType;
  label: string;
  helper: string;
  item?: BuildItem;
  pending?: boolean;
  onPick: () => void;
  onRemove: (itemId: string) => void;
};

export function BuildSlot({ componentType, label, helper, item, pending, onPick, onRemove }: BuildSlotProps) {
  return (
    <article className="rounded-2xl border border-border bg-surface p-4 hover:border-accent/50 transition">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <div className="text-accent">{componentIcons[componentType]}</div>
            <div>
              <p className="text-xs uppercase tracking-wide text-muted font-medium">{componentType}</p>
              <h3 className="text-base font-semibold text-foreground">{label}</h3>
            </div>
          </div>
          <p className="mt-2 text-xs text-muted">{helper}</p>
        </div>

        {!item && (
          <button
            type="button"
            onClick={onPick}
            className="inline-flex min-h-10 items-center justify-center rounded-full border border-accent bg-accent/10 px-4 text-xs font-semibold uppercase tracking-wide text-accent hover:bg-accent hover:text-accent-foreground transition disabled:opacity-50"
            disabled={pending}
          >
            {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Select'}
          </button>
        )}
      </div>

      {item ? (
        <div className="mt-4 rounded-xl border border-success/30 bg-success/5 p-3">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-sm font-semibold text-foreground">{item.component_name || 'Component selected'}</p>
              <p className="mt-1 text-xs text-muted">{formatTzs(item.unit_estimated_price_tzs)}</p>
              {item.component_specs && (
                <p className="mt-2 text-xs text-muted">{item.component_specs}</p>
              )}
            </div>

            <div className="flex items-center gap-2">
              {item.is_auto_replaced && (
                <div className="px-2 py-1 rounded-full bg-warning/20 border border-warning/30">
                  <p className="text-xs font-medium text-warning">Auto-replaced</p>
                </div>
              )}
              <button
                type="button"
                onClick={() => onRemove(item.id)}
                className="inline-flex min-h-9 min-w-9 items-center justify-center rounded-md border border-border text-muted hover:text-danger hover:bg-danger/10 transition"
                aria-label={`Remove ${label}`}
              >
                ✕
              </button>
            </div>
          </div>
        </div>
      ) : (
        <p className="mt-4 rounded-xl border border-dashed border-border p-3 text-sm text-muted text-center">
          Click "Select" to choose a component
        </p>
      )}
    </article>
  );
}
