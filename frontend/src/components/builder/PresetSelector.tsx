import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertCircle, ChevronDown, ChevronRight } from 'lucide-react';
import { usePresetsQuery } from '../../hooks/usePCBuilder';
import { formatTzs } from '../../lib/currency';
import type { BuildPreset } from '../../types/api';

type PresetSelectorProps = {
  onLoadPreset: (preset: BuildPreset) => void;
  isLoading?: boolean;
};

export function PresetSelector({ onLoadPreset, isLoading }: PresetSelectorProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const presetsQuery = usePresetsQuery();
  const presets = presetsQuery.data ?? [];

  return (
    <div className="space-y-3">
      <div>
        <h3 className="text-sm font-semibold text-foreground">Pre-Built Configurations</h3>
        <p className="mt-1 text-xs text-muted">Browse recommended builds optimized for different use cases</p>
      </div>

      {presetsQuery.isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={`preset-skeleton-${i}`} className="h-20 animate-pulse rounded-lg border border-border bg-surface" />
          ))}
        </div>
      ) : null}

      {presetsQuery.isError ? (
        <div className="rounded-lg border border-danger/30 bg-danger/5 p-3 flex gap-2">
          <AlertCircle className="h-4 w-4 text-danger shrink-0 mt-0.5" />
          <p className="text-sm text-danger">Failed to load presets. Please try again.</p>
        </div>
      ) : null}

      {!presetsQuery.isLoading && presets.length === 0 ? (
        <p className="text-sm text-muted">No presets available right now.</p>
      ) : null}

      <div className="space-y-2">
        {presets.map((preset) => (
          <div
            key={preset.id}
            className="rounded-lg border border-border bg-surface overflow-hidden"
          >
            <button
              type="button"
              onClick={() => setExpandedId(expandedId === preset.id ? null : preset.id)}
              className="w-full px-4 py-3 flex items-center justify-between gap-3 hover:bg-surface-hover transition"
            >
              <div className="flex-1 text-left min-w-0">
                <p className="font-semibold text-foreground text-sm truncate">{preset.name}</p>
                <p className="text-xs text-muted mt-1">{preset.cpu_family} • {preset.pc_build_preset_items?.length || 0} components</p>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <div className="text-right">
                  <p className="font-semibold text-foreground text-sm">{formatTzs(preset.total_tzs)}</p>
                  <p className={`text-xs font-medium ${
                    preset.compatibility_status === 'valid'
                      ? 'text-success'
                      : preset.compatibility_status === 'warning'
                        ? 'text-warning'
                        : 'text-muted'
                  }`}>
                    {preset.compatibility_status === 'valid' ? '✓ Compatible' : `• ${preset.compatibility_status}`}
                  </p>
                </div>

                <ChevronDown
                  className={`h-4 w-4 text-muted transition-transform ${
                    expandedId === preset.id ? 'rotate-180' : ''
                  }`}
                />
              </div>
            </button>

            <AnimatePresence>
              {expandedId === preset.id ? (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="border-t border-border overflow-hidden"
                >
                  <div className="px-4 py-3 space-y-3 bg-surface/50">
                    {/* Component breakdown */}
                    {preset.pc_build_preset_items && preset.pc_build_preset_items.length > 0 ? (
                      <div className="space-y-2">
                        <p className="text-xs font-semibold text-muted uppercase tracking-wide">Components</p>
                        <div className="space-y-1">
                          {preset.pc_build_preset_items.map((item) => (
                            <div
                              key={item.id}
                              className="text-xs flex items-center justify-between gap-2 py-1"
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <span className="text-muted capitalize shrink-0 w-24">{item.component_type}:</span>
                                <span className="text-foreground truncate">{item.pc_components?.name || item.component_id}</span>
                              </div>
                              <span className="text-muted shrink-0">{formatTzs(item.unit_price_tzs)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : null}

                    {/* Specs */}
                    {(preset.estimated_system_wattage || preset.required_psu_wattage) ? (
                      <div className="space-y-1 pt-2 border-t border-border/50">
                        <p className="text-xs font-semibold text-muted uppercase tracking-wide">Specs</p>
                        <div className="flex items-center gap-4 text-xs text-foreground">
                          {preset.estimated_system_wattage ? (
                            <span>Est. <strong>{preset.estimated_system_wattage}W</strong></span>
                          ) : null}
                          {preset.required_psu_wattage ? (
                            <span>PSU: <strong>{preset.required_psu_wattage}W</strong></span>
                          ) : null}
                        </div>
                      </div>
                    ) : null}

                    {/* Load button */}
                    <button
                      type="button"
                      onClick={() => onLoadPreset(preset)}
                      disabled={isLoading}
                      className="mt-2 w-full text-xs font-semibold uppercase tracking-wide px-3 py-2 rounded-md bg-accent text-accent-foreground hover:opacity-90 transition disabled:opacity-50"
                    >
                      <ChevronRight className="h-3 w-3 inline mr-1" />
                      Load This Build
                    </button>
                  </div>
                </motion.div>
              ) : null}
            </AnimatePresence>
          </div>
        ))}
      </div>
    </div>
  );
}
