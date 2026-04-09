import { AlertCircle, Zap, Gamepad2, Briefcase, Award } from 'lucide-react';
import { usePresetsQuery } from '../../hooks/usePCBuilder';
import { formatTzs } from '../../lib/currency';
import type { BuildPreset } from '../../types/api';

type PresetSelectorProps = {
  onLoadPreset: (preset: BuildPreset) => void;
  isLoading?: boolean;
};

const tagConfig = {
  gaming: { icon: <Gamepad2 className="h-4 w-4" />, label: 'Gaming', color: 'bg-blue-500/10 text-blue-600 border-blue-500/30' },
  editing: { icon: <Briefcase className="h-4 w-4" />, label: 'Editing', color: 'bg-purple-500/10 text-purple-600 border-purple-500/30' },
  budget: { icon: <Zap className="h-4 w-4" />, label: 'Budget', color: 'bg-green-500/10 text-green-600 border-green-500/30' },
  highend: { icon: <Award className="h-4 w-4" />, label: 'High-End', color: 'bg-amber-500/10 text-amber-600 border-amber-500/30' }
};

function inferTag(cpuFamily: string): keyof typeof tagConfig {
  const family = cpuFamily?.toLowerCase() || '';
  if (family.includes('high') || family.includes('extreme')) return 'highend';
  if (family.includes('budget') || family.includes('entry')) return 'budget';
  if (family.includes('gaming')) return 'gaming';
  if (family.includes('creator') || family.includes('workstation')) return 'editing';
  return 'gaming';
}

export function PresetSelector({ onLoadPreset, isLoading }: PresetSelectorProps) {
  const presetsQuery = usePresetsQuery();
  const presets = presetsQuery.data ?? [];

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold text-foreground">🔥 Choose a Starting Point</h2>
        <p className="mt-1 text-sm text-muted">Start with a ready-made build or create your own from scratch</p>
      </div>

      {presetsQuery.isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={`preset-skeleton-${i}`} className="h-64 animate-pulse rounded-xl border border-border bg-surface" />
          ))}
        </div>
      ) : null}

      {presetsQuery.isError ? (
        <div className="rounded-lg border border-danger/30 bg-danger/5 p-4 flex gap-3">
          <AlertCircle className="h-5 w-5 text-danger shrink-0 mt-0.5" />
          <p className="text-sm text-danger">Failed to load presets. Please try again.</p>
        </div>
      ) : null}

      {!presetsQuery.isLoading && presets.length === 0 ? (
        <p className="text-sm text-muted text-center py-8">No presets available right now.</p>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {presets.map((preset) => {
          const tag = inferTag(preset.cpu_family);
          const tagCfg = tagConfig[tag];
          const componentCount = preset.pc_build_preset_items?.length || 0;

          return (
            <div
              key={preset.id}
              className="group relative rounded-xl border border-border bg-surface hover:border-accent hover:shadow-lg transition-all overflow-hidden flex flex-col"
            >
              {/* Header */}
              <div className="border-b border-border p-4">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex-1">
                    <h3 className="font-semibold text-foreground text-lg truncate">{preset.name}</h3>
                  </div>
                  {preset.compatibility_status && preset.compatibility_status !== 'valid' && (
                    <div className={`inline-flex items-center px-2 py-1 rounded-full border text-xs font-medium gap-1 ${
                      preset.compatibility_status === 'warning' 
                        ? 'bg-warning/10 text-warning border-warning/30'
                        : 'bg-danger/10 text-danger border-danger/30'
                    }`}>
                      {preset.compatibility_status === 'warning' ? '⚠️' : '❌'} {preset.compatibility_status}
                    </div>
                  )}
                </div>
                <p className="text-xs text-muted">{preset.cpu_family}</p>
              </div>

              {/* Price & Tag */}
              <div className="px-4 pt-3 pb-2 space-y-2">
                <div className="flex items-baseline justify-between">
                  <p className="text-xs text-muted">Price</p>
                  <p className="font-bold text-lg text-accent">{formatTzs(preset.total_tzs)}</p>
                </div>
                <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border ${tagCfg.color}`}>
                  {tagCfg.icon}
                  <span className="text-xs font-medium">{tagCfg.label}</span>
                </div>
              </div>

              {/* Specs */}
              <div className="px-4 py-3 bg-surface/50 space-y-2 flex-1">
                <p className="text-xs font-semibold text-muted uppercase tracking-wide">Specs</p>
                <div className="space-y-1">
                  {preset.pc_build_preset_items && preset.pc_build_preset_items.length > 0 && (
                    <>
                      <p className="text-xs text-foreground">
                        <span className="text-muted">CPU:</span> {preset.pc_build_preset_items.find(i => i.component_type === 'cpu')?.pc_components?.name || '—'}
                      </p>
                      <p className="text-xs text-foreground">
                        <span className="text-muted">GPU:</span> {preset.pc_build_preset_items.find(i => i.component_type === 'gpu')?.pc_components?.name || '—'}
                      </p>
                      <p className="text-xs text-foreground">
                        <span className="text-muted">Components:</span> {componentCount}
                      </p>
                    </>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="border-t border-border p-3 space-y-2">
                <button
                  type="button"
                  onClick={() => onLoadPreset(preset)}
                  disabled={isLoading}
                  className="w-full px-4 py-2.5 rounded-lg bg-accent text-accent-foreground font-semibold text-sm hover:bg-accent/90 transition disabled:opacity-50"
                >
                  ✓ Use This Build
                </button>
                <button
                  type="button"
                  className="w-full px-4 py-2 rounded-lg border border-border text-foreground text-sm hover:bg-surface-hover transition"
                >
                  View Details
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
