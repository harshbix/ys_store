import { Loader2, Cpu, HardDrive, Zap, Box, Wind, Monitor, X } from 'lucide-react';
import type { BuildItem, ComponentType } from '../../types/api';
import { formatTzs } from '../../lib/currency';
import { Card } from '../ui/card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/badge';
import { cn } from '../../lib/utils';

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
    <Card className="p-5 hover:border-primary transition-colors hover:shadow relative overflow-hidden flex flex-col h-full min-w-0">
      <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3">
            <div className="text-primary shrink-0">{componentIcons[componentType]}</div>
            <div className="min-w-0">
              <p className="text-[10px] sm:text-xs uppercase tracking-wider text-muted-foreground font-bold truncate">{componentType}</p>
              <h3 className="text-lg sm:text-base font-bold text-foreground truncate">{label}</h3>
            </div>
          </div>
          <p className="mt-2.5 text-sm sm:text-xs text-muted-foreground leading-relaxed max-w-[95%]">{helper}</p>
        </div>

        {!item && (
          <Button
            type="button"
            onClick={onPick}
            className="w-full sm:w-auto shrink-0 shadow-sm min-h-[3rem] sm:min-h-[2.25rem] px-5 sm:px-4 text-base sm:text-sm"
            disabled={pending}
          >
            {pending ? <Loader2 className="h-5 w-5 sm:h-4 sm:w-4 animate-spin" /> : 'Select'}
          </Button>
        )}
      </div>

      {item ? (
        <div className="mt-5 rounded-xl border border-primary/20 bg-primary/5 p-4 flex-1 flex flex-col justify-between">
          <div className="flex items-start justify-between gap-3 min-w-0">
            <div className="min-w-0 flex-1">
              <p className="text-base sm:text-sm font-bold text-foreground leading-snug line-clamp-2" title={item.component_name}>{item.component_name || 'Component selected'}</p>
              <p className="mt-1.5 text-lg sm:text-base font-bold text-primary">{formatTzs(item.unit_estimated_price_tzs)}</p>
              {item.component_specs && (
                <p className="mt-2 text-sm sm:text-xs text-muted-foreground line-clamp-2">{item.component_specs}</p>
              )}
            </div>

            <div className="flex flex-col items-end gap-2.5 shrink-0">
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => onRemove(item.id)}
                className="h-10 w-10 sm:h-8 sm:w-8 rounded-full text-muted-foreground hover:text-destructive hover:bg-destructive/10 hover:border-destructive/20 transition-colors shadow-sm"
                aria-label={`Remove ${label}`}
                title="Remove Item"
              >
                <X className="h-4 w-4" />
              </Button>
              
              {item.is_auto_replaced && (
                <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400 border-yellow-200 dark:border-yellow-700 hover:bg-yellow-100 dark:hover:bg-yellow-900/30 px-2.5 py-1 sm:py-0.5 rounded">
                  <span className="text-[11px] sm:text-[10px] font-bold uppercase tracking-wider">Auto-replaced</span>
                </Badge>
              )}
            </div>
          </div>
          
          <Button
            type="button"
            variant="outline"
            onClick={onPick}
            className="mt-4 w-full min-h-[3rem] sm:min-h-[2.25rem] text-base sm:text-sm px-4 shadow-sm bg-background hover:bg-accent hover:text-accent-foreground"
          >
            Change Component
          </Button>
        </div>
      ) : (
        <div className="mt-5 flex-1 flex items-center justify-center rounded-xl border-2 border-dashed border-border bg-muted/30 p-5">
          <p className="text-base sm:text-sm text-muted-foreground text-center font-medium">
            Click <span className="text-primary font-bold">Select</span> to choose a component
          </p>
        </div>
      )}
    </Card>
  );
}
