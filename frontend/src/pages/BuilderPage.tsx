import { motion } from 'framer-motion';
import { useEffect, useMemo, useRef, useState } from 'react';
import { BuildPartPicker } from '../components/builder/BuildPartPicker';
import { BuildSlot } from '../components/builder/BuildSlot';
import { BuildStickyBar } from '../components/builder/BuildStickyBar';
import { BuildSummary } from '../components/builder/BuildSummary';
import { CompatibilityBanner } from '../components/builder/CompatibilityBanner';
import { ErrorState } from '../components/feedback/ErrorState';
import { useBuilds } from '../hooks/useBuilds';
import type { BuildItem, ComponentType, Product } from '../types/api';

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

  const handleSelectProduct = async (product: Product) => {
    if (!activeBuildId || !pickerComponent) return;
    await upsertItemMutation.mutateAsync({
      buildId: activeBuildId,
      body: {
        component_type: pickerComponent,
        product_id: product.id
      }
    });
    setPickerOpen(false);
  };

  const handleValidate = () => {
    if (!activeBuildId) return;
    validateMutation.mutate({ buildId: activeBuildId, autoReplace: true });
  };

  const handleAddToCart = () => {
    if (!activeBuildId) return;
    addToCartMutation.mutate(activeBuildId);
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5 pb-24 lg:pb-8">
      <header>
        <h1 className="font-display text-2xl font-semibold text-foreground">PC Builder</h1>
        <p className="mt-1 text-sm text-muted">Create or resume your build, validate compatibility, then add to cart.</p>
      </header>

      {buildQuery.isError ? <ErrorState onRetry={() => buildQuery.refetch()} /> : null}

      <CompatibilityBanner payload={validateMutation.data?.data} />

      <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
        <section className="space-y-4">
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
        </section>

        <aside className="space-y-4 lg:sticky lg:top-20 lg:self-start">
          {build ? <BuildSummary build={build} /> : null}
          <button
            type="button"
            onClick={handleValidate}
            disabled={!activeBuildId || validateMutation.isPending}
            className="min-h-11 w-full rounded-full border border-border bg-surface text-sm font-semibold text-foreground disabled:opacity-40"
          >
            Validate Build
          </button>
          <button
            type="button"
            onClick={handleAddToCart}
            disabled={!activeBuildId || addToCartMutation.isPending}
            className="min-h-11 w-full rounded-full bg-primary text-sm font-semibold text-primaryForeground disabled:opacity-40"
          >
            Add Build to Cart
          </button>
        </aside>
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
    </motion.div>
  );
}
