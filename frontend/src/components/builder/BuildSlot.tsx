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
    <article className="rounded-2xl border border-slate-200 dark:border-slate-700/50 bg-white dark:bg-slate-900/40 p-5 hover:border-blue-400 dark:hover:border-blue-600 transition-colors shadow-sm hover:shadow relative overflow-hidden flex flex-col h-full min-w-0">
      <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3">
            <div className="text-blue-600 dark:text-blue-400 shrink-0">{componentIcons[componentType]}</div>
            <div className="min-w-0">
              <p className="text-[10px] sm:text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400 font-bold truncate">{componentType}</p>
              <h3 className="text-lg sm:text-base font-bold text-slate-800 dark:text-slate-200 truncate">{label}</h3>
            </div>
          </div>
          <p className="mt-2.5 text-sm sm:text-xs text-slate-500 dark:text-slate-400 leading-relaxed max-w-[95%]">{helper}</p>
        </div>

        {!item && (
          <button
            type="button"
            onClick={onPick}
            className="w-full sm:w-auto inline-flex min-h-12 sm:min-h-9 items-center justify-center rounded-lg bg-blue-600 hover:bg-blue-700 text-white px-5 sm:px-4 text-base sm:text-sm font-semibold transition active:bg-blue-800 focus:ring-2 focus:ring-blue-500 focus:outline-none disabled:opacity-50 shrink-0 shadow-sm"
            disabled={pending}
          >
            {pending ? <Loader2 className="h-5 w-5 sm:h-4 sm:w-4 animate-spin" /> : 'Select'}
          </button>
        )}
      </div>

      {item ? (
        <div className="mt-5 rounded-xl border border-blue-200 dark:border-blue-800/50 bg-blue-50/50 dark:bg-blue-900/20 p-4 flex-1 flex flex-col justify-between">
          <div className="flex items-start justify-between gap-3 min-w-0">
            <div className="min-w-0 flex-1">
              <p className="text-base sm:text-sm font-bold text-slate-800 dark:text-slate-200 leading-snug line-clamp-2" title={item.component_name}>{item.component_name || 'Component selected'}</p>
              <p className="mt-1.5 text-lg sm:text-base font-bold text-blue-600 dark:text-blue-400">{formatTzs(item.unit_estimated_price_tzs)}</p>
              {item.component_specs && (
                <p className="mt-2 text-sm sm:text-xs text-slate-500 dark:text-slate-400 line-clamp-2">{item.component_specs}</p>
              )}
            </div>

            <div className="flex flex-col items-end gap-2.5 shrink-0">
              <button
                type="button"
                onClick={() => onRemove(item.id)}
                className="inline-flex h-10 w-10 sm:h-8 sm:w-8 items-center justify-center rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-400 hover:text-red-600 hover:border-red-200 dark:hover:border-red-800 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 shadow-sm"
                aria-label={`Remove ${label}`}
                title="Remove Item"
              >
                <span className="text-base sm:text-sm leading-none block mb-[1px]">✕</span>
              </button>
              
              {item.is_auto_replaced && (
                <div className="px-2.5 py-1 sm:py-0.5 rounded bg-yellow-100 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-700">
                  <p className="text-[11px] sm:text-[10px] font-bold text-yellow-700 dark:text-yellow-400 uppercase tracking-wider">Auto-replaced</p>
                </div>
              )}
            </div>
          </div>
          
          <button
            type="button"
            onClick={onPick}
            className="mt-4 w-full inline-flex min-h-12 sm:min-h-9 items-center justify-center rounded-lg border-2 sm:border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-4 text-base sm:text-sm font-semibold sm:font-medium hover:bg-slate-50 dark:hover:bg-slate-700 transition focus:ring-2 focus:ring-blue-500 focus:outline-none shadow-sm"
          >
            Change Component
          </button>
        </div>
      ) : (
        <div className="mt-5 flex-1 flex items-center justify-center rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/20 p-5">
          <p className="text-base sm:text-sm text-slate-500 dark:text-slate-400 text-center font-medium">
            Click <span className="text-blue-600 dark:text-blue-400 font-bold">Select</span> to choose a component
          </p>
        </div>
      )}
    </article>
  );
}
