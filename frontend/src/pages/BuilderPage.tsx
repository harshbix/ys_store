import { useEffect, useMemo, useRef, useState } from 'react';
import { SEO } from '../components/seo/SEO';
import { useNavigate } from 'react-router-dom';
import { BuildPartPicker } from '../components/builder/BuildPartPicker';
import { BuildSlot } from '../components/builder/BuildSlot';
import { BuildStickyBar } from '../components/builder/BuildStickyBar';
import { BuildSummary } from '../components/builder/BuildSummary';
import { CompatibilityBanner } from '../components/builder/CompatibilityBanner';
import { PresetSelector } from '../components/builder/PresetSelector';
import { ErrorState } from '../components/feedback/ErrorState';
import { Button } from '../components/ui/Button';
import { useBuilds } from '../hooks/useBuilds';
import type { BuildItem, ComponentType, PCComponent, BuildPreset } from '../types/api';

const slotDefinitions: Array<{ key: ComponentType; label: string; helper: string }> = [
  { key: 'cpu', label: 'Processor', helper: 'Core performance and workload handling' },
  { key: 'motherboard', label: 'Motherboard', helper: 'Platform foundation and socket compatibility' },
  { key: 'gpu', label: 'Graphics Card', helper: 'Gaming and rendering acceleration' },
  { key: 'ram', label: 'Memory', helper: 'Multitasking and application responsiveness' },
  { key: 'storage', label: 'Storage', helper: 'Fast boot and project load speed' },
  { key: 'psu', label: 'Power Supply', helper: 'Stable wattage with upgrade headroom' },
  { key: 'case', label: 'Case', helper: 'Airflow and component fit' },
  { key: 'cooler', label: 'Cooler', helper: 'Thermal stability under heavy load' }
];

export default function BuilderPage() {
  const navigate = useNavigate();
  const {
    activeBuildId,
    buildQuery,
    ensureBuild,
    upsertItemMutation,
    deleteItemMutation,
    validateMutation,
    addToCartMutation
  } = useBuilds();

  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerComponent, setPickerComponent] = useState<ComponentType | null>(null);
  const ensuredRef = useRef(false);

  useEffect(() => {
    if (ensuredRef.current) return;
    ensuredRef.current = true;
    void ensureBuild();
  }, [ensureBuild]);

  const build = buildQuery.data?.data;

  const itemsByType = useMemo(() => {
    const lookup: Partial<Record<ComponentType, BuildItem>> = {};
    (build?.items || []).forEach((item) => {
      lookup[item.component_type] = item;
    });
    return lookup;
  }, [build?.items]);

  const handleSelectSlot = (componentType: ComponentType) => {
    setPickerComponent(componentType);
    setPickerOpen(true);
  };

  const handleSelectProduct = async (component: PCComponent) => {
    if (!pickerComponent) return;

    const buildId = await ensureBuild();
    if (!buildId) return;

    try {
      await upsertItemMutation.mutateAsync({
        buildId,
        body: {
          component_type: pickerComponent,
          product_id: component.id
        }
      });
      setPickerOpen(false);
    } catch {
      // Mutation hook already surfaces a friendly toast.
    }
  };

  const handleValidate = () => {
    if (!activeBuildId) return;
    validateMutation.mutate({ buildId: activeBuildId, autoReplace: true });
  };

  const handleAddToCart = () => {
    if (!activeBuildId) return;
    addToCartMutation.mutate(activeBuildId);
  };

  const handleLoadPreset = async (preset: BuildPreset) => {
    const buildId = await ensureBuild();
    if (!buildId || !preset.pc_build_preset_items) return;

    try {
      // Load all preset components into the build
      for (const item of preset.pc_build_preset_items) {
        await upsertItemMutation.mutateAsync({
          buildId,
          body: {
            component_type: item.component_type,
            product_id: item.component_id // Use component_id as product_id since we're using PC components
          }
        });
      }
      
      // Scroll to builder section
      setTimeout(() => {
        const builderSection = document.querySelector('[data-section="builder"]');
        builderSection?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    } catch (err) {
      console.error('Failed to load preset:', err);
    }
  };

  return (
    <>
      <SEO 
        title="Custom PC Builder" 
        description="Design your custom PC build from a variety of compatible parts suitable for gaming, productivity, and workstation needs."
      />
      <div className="space-y-8 pb-24 lg:pb-8">
        {/* Header */}
        <div className="space-y-3">
          <Button size="sm" variant="secondary" onClick={() => navigate(-1)}>
            ← Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Build Your PC</h1>
            <p className="mt-2 text-muted">Choose from pre-built systems or customize every component</p>
          </div>
        </div>

        {buildQuery.isError ? <ErrorState onRetry={() => buildQuery.refetch()} /> : null}

        <CompatibilityBanner payload={validateMutation.data?.data} />

        {/* Main Grid */}
        <div className="grid gap-8 lg:grid-cols-[1fr_360px] items-start">
          <main className="space-y-8 min-w-0 w-full overflow-hidden">
            {/* Presets Section */}
            <PresetSelector onLoadPreset={handleLoadPreset} isLoading={upsertItemMutation.isPending} />

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border"></div>
              </div>
              <div className="relative flex justify-center">
                <span className="bg-background px-4 text-sm font-medium text-muted">OR</span>
              </div>
            </div>

            {/* Builder Section */}
            <section data-section="builder" className="space-y-4">
              <div>
                <h2 className="text-2xl font-bold text-foreground">Customize Your Build</h2>
                <p className="mt-1 text-sm text-muted">Select each component or start from a preset</p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                {slotDefinitions.map((slot) => (
                  <BuildSlot
                    key={slot.key}
                    componentType={slot.key}
                    label={slot.label}
                    helper={slot.helper}
                    item={itemsByType[slot.key]}
                    pending={upsertItemMutation.isPending}
                    onPick={() => handleSelectSlot(slot.key)}
                    onRemove={(itemId) => {
                      if (!activeBuildId) return;
                      deleteItemMutation.mutate({ buildId: activeBuildId, itemId });
                    }}
                  />
                ))}
              </div>
            </section>
          </main>

          {/* Sidebar */}
          <aside className="space-y-4 lg:sticky lg:top-20 lg:self-start">
            {build ? <BuildSummary build={build} /> : null}
            <button
              type="button"
              onClick={handleValidate}
              disabled={!activeBuildId || validateMutation.isPending || !build || build.items.length === 0}
              className="min-h-12 w-full rounded-lg border border-warning bg-warning/10 text-warning font-semibold text-sm hover:bg-warning/20 transition disabled:opacity-50"
            >
              {validateMutation.isPending ? '⏳ Validating...' : '✓ Validate Build'}
            </button>
            <button
              type="button"
              onClick={handleAddToCart}
              disabled={!activeBuildId || addToCartMutation.isPending}
              className="min-h-12 w-full rounded-lg bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 transition disabled:opacity-50"
            >
              {addToCartMutation.isPending ? '⏳ Adding...' : '🛒 Add to Cart'}
            </button>
          </aside>
        </div>
      </div>

      <BuildPartPicker
        open={pickerOpen}
        componentType={pickerComponent}
        onClose={() => setPickerOpen(false)}
        onSelect={handleSelectProduct}
      />

      <BuildStickyBar
        total={build?.total_estimated_price_tzs || 0}
        onValidate={handleValidate}
        onAddToCart={handleAddToCart}
        validating={validateMutation.isPending}
        adding={addToCartMutation.isPending}
      />
    </>
  );
}
