import { useState, useMemo } from 'react';
import { AlertCircle, Zap, Gamepad2, Briefcase, Award, Search, ChevronLeft, ChevronRight, Filter, Sparkles } from 'lucide-react';
import { usePresetsQuery } from '../../hooks/usePCBuilder';
import { formatTzs } from '../../lib/currency';
import { Modal } from '../ui/Modal';
import { SearchInput } from '../ui/SearchInput';
import type { BuildPreset } from '../../types/api';

type PresetSelectorProps = {
  onLoadPreset: (preset: BuildPreset) => void;
  isLoading?: boolean;
};

type Category = 'all' | 'budget' | 'mid-range' | 'high-end' | 'gaming' | 'editing' | 'streaming' | 'value';

const categoryConfig: Record<Category, { icon: React.ReactNode; label: string; color: string }> = {
  all: { icon: <Sparkles className="h-4 w-4" />, label: 'All', color: 'bg-slate-500/10 text-slate-600 hover:bg-slate-500/20 border-slate-500/30' },
  budget: { icon: <Zap className="h-4 w-4" />, label: 'Budget', color: 'bg-green-500/10 text-green-600 hover:bg-green-500/20 border-green-500/30' },
  'mid-range': { icon: <Briefcase className="h-4 w-4" />, label: 'Mid-Range', color: 'bg-blue-500/10 text-blue-600 hover:bg-blue-500/20 border-blue-500/30' },
  'high-end': { icon: <Award className="h-4 w-4" />, label: 'High-End', color: 'bg-amber-500/10 text-amber-600 hover:bg-amber-500/20 border-amber-500/30' },
  gaming: { icon: <Gamepad2 className="h-4 w-4" />, label: 'Gaming', color: 'bg-red-500/10 text-red-600 hover:bg-red-500/20 border-red-500/30' },
  editing: { icon: <Briefcase className="h-4 w-4" />, label: 'Editing', color: 'bg-purple-500/10 text-purple-600 hover:bg-purple-500/20 border-purple-500/30' },
  streaming: { icon: <Gamepad2 className="h-4 w-4" />, label: 'Streaming', color: 'bg-pink-500/10 text-pink-600 hover:bg-pink-500/20 border-pink-500/30' },
  value: { icon: <Award className="h-4 w-4" />, label: 'Best Value', color: 'bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 border-emerald-500/30' }
};

function inferCategories(preset: BuildPreset): Category[] {
  const categories: Category[] = [];
  const priceThresholdLow = 30000;
  const priceThresholdMid = 70000;
  const priceThresholdHigh = 150000;
  
  const price = preset.total_tzs || 0;
  const cpuName = (preset.cpu_family || '').toLowerCase();
  const presetName = (preset.name || '').toLowerCase();
  
  // Infer price tier
  if (price <= priceThresholdLow) {
    categories.push('budget');
  } else if (price <= priceThresholdMid) {
    categories.push('mid-range');
  } else if (price > priceThresholdHigh) {
    categories.push('high-end');
  } else {
    categories.push('mid-range');
  }
  
  // Infer use case
  if (cpuName.includes('gaming') || presetName.includes('gaming') || presetName.includes('game')) {
    categories.push('gaming');
  }
  if (cpuName.includes('creator') || cpuName.includes('workstation') || presetName.includes('creator') || presetName.includes('edit')) {
    categories.push('editing');
  }
  if (presetName.includes('stream') || presetName.includes('content')) {
    categories.push('streaming');
  }
  
  // Best value heuristic: good specs at reasonable price
  if (price <= priceThresholdMid && price > priceThresholdLow) {
    categories.push('value');
  }
  
  return categories.length > 0 ? categories : ['value'];
}

export function PresetSelector({ onLoadPreset, isLoading }: PresetSelectorProps) {
  const presetsQuery = usePresetsQuery();
  const allPresets = presetsQuery.data ?? [];
  
  const [selectedCategory, setSelectedCategory] = useState<Category>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'price-low' | 'price-high' | 'name'>('price-low');
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [selectedPreset, setSelectedPreset] = useState<BuildPreset | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  // Filter and sort presets
  const filteredPresets = useMemo(() => {
    let result = allPresets;
    
    // Filter by category
    if (selectedCategory !== 'all') {
      result = result.filter(preset => inferCategories(preset).includes(selectedCategory));
    }
    
    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(preset =>
        preset.name.toLowerCase().includes(query) ||
        preset.cpu_family.toLowerCase().includes(query)
      );
    }
    
    // Sort
    result = [...result].sort((a, b) => {
      switch (sortBy) {
        case 'price-low':
          return (a.total_tzs || 0) - (b.total_tzs || 0);
        case 'price-high':
          return (b.total_tzs || 0) - (a.total_tzs || 0);
        case 'name':
          return a.name.localeCompare(b.name);
        default:
          return 0;
      }
    });
    
    return result;
  }, [allPresets, selectedCategory, searchQuery, sortBy]);

  // Carousel logic - show 4 on desktop, 2 on tablet, 1 on mobile by default
  const visibleCount = 4; // Desktop default, adjust with CSS classes
  const carouselItems = filteredPresets;
  const maxIndex = Math.max(0, carouselItems.length - 1);
  const safeIndex = Math.min(carouselIndex, maxIndex);

  const handlePrevious = () => {
    setCarouselIndex(Math.max(0, safeIndex - 1));
  };

  const handleNext = () => {
    setCarouselIndex(Math.min(maxIndex, safeIndex + 1));
  };

  const handleViewDetails = (preset: BuildPreset) => {
    setSelectedPreset(preset);
    setDetailsOpen(true);
  };

  const handleUsePreset = async (preset: BuildPreset) => {
    await onLoadPreset(preset);
    setDetailsOpen(false);
  };

  // Get CPU and GPU names from preset
  const getCpuGpu = (preset: BuildPreset) => {
    const cpu = preset.pc_build_preset_items?.find(i => i.component_type === 'cpu')?.pc_components?.name || 'N/A';
    const gpu = preset.pc_build_preset_items?.find(i => i.component_type === 'gpu')?.pc_components?.name || 'N/A';
    return { cpu, gpu };
  };

  // Get top 3 highlights from preset
  const getHighlights = (preset: BuildPreset): string[] => {
    const highlights: string[] = [];
    
    const cpuComp = preset.pc_build_preset_items?.find(i => i.component_type === 'cpu')?.pc_components;
    const ramComp = preset.pc_build_preset_items?.find(i => i.component_type === 'ram')?.pc_components;
    const storageComp = preset.pc_build_preset_items?.find(i => i.component_type === 'storage')?.pc_components;
    
    if (cpuComp?.name) {
      const cpuName = cpuComp.name.split(' ').slice(0, 2).join(' ');
      highlights.push(cpuName);
    }
    
    if (ramComp?.name) {
      highlights.push(ramComp.name.split(' ')[0] + ' RAM');
    }
    
    if (storageComp?.name) {
      const storageSize = storageComp.name.match(/\d+\s*(TB|GB)/)?.[0] || 'Storage';
      highlights.push(storageSize);
    }
    
    return highlights.slice(0, 3);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h2 className="text-3xl font-bold text-foreground">Pick a Starting Build</h2>
        <p className="text-base text-muted">Browse curated PCs by price and performance. Start with one, then customize it however you want.</p>
      </div>

      {presetsQuery.isError ? (
        <div className="rounded-lg border border-danger/30 bg-danger/5 p-4 flex gap-3">
          <AlertCircle className="h-5 w-5 text-danger shrink-0 mt-0.5" />
          <p className="text-sm text-danger">Failed to load builds. Please try again.</p>
        </div>
      ) : null}

      {!presetsQuery.isLoading && allPresets.length === 0 ? (
        <p className="text-sm text-muted text-center py-12">No builds available right now.</p>
      ) : null}

      {!presetsQuery.isError && allPresets.length > 0 ? (
        <>
          {/* Filter Bar */}
          <div className="space-y-4">
            {/* Search & Sort */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1 min-w-0">
                <SearchInput
                  value={searchQuery}
                  placeholder="Search by name or CPU..."
                  onDebouncedChange={setSearchQuery}
                  debounceMs={200}
                />
              </div>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-3 py-2.5 min-h-11 rounded-lg border border-border bg-surface text-sm text-foreground outline-none ring-accent transition focus:ring-2"
              >
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="name">Name A-Z</option>
              </select>
            </div>

            {/* Category Chips */}
            <div className="flex flex-wrap gap-2">
              {(Object.entries(categoryConfig) as Array<[Category, any]>).map(([category, config]) => (
                <button
                  key={category}
                  onClick={() => {
                    setSelectedCategory(category);
                    setCarouselIndex(0);
                  }}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-full border transition text-sm font-medium ${
                    selectedCategory === category
                      ? `${config.color.split(' hover:')[0]} border-current`
                      : `${config.color}`
                  }`}
                >
                  {config.icon}
                  <span>{config.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Results Info */}
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted">
              {filteredPresets.length} {filteredPresets.length === 1 ? 'build' : 'builds'} available
            </p>
          </div>

          {/* Carousel Container */}
          {presetsQuery.isLoading ? (
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={`skeleton-${i}`} className="h-80 animate-pulse rounded-xl border border-border bg-surface/50" />
              ))}
            </div>
          ) : filteredPresets.length === 0 ? (
            <div className="text-center py-12">
              <Filter className="h-12 w-12 mx-auto text-muted/40 mb-3" />
              <p className="text-muted">No builds match your filters. Try adjusting your search.</p>
            </div>
          ) : (
            <div className="relative">
              {/* Carousel Grid */}
              <div className="overflow-hidden">
                <div
                  className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 transition-all duration-300"
                  key={`carousel-${safeIndex}`}
                >
                  {carouselItems.slice(safeIndex, safeIndex + visibleCount).map((preset) => {
                    const { cpu, gpu } = getCpuGpu(preset);
                    const highlights = getHighlights(preset);
                    const categories = inferCategories(preset);
                    const categoryColor = categoryConfig[categories[0]]?.color || categoryConfig.value.color;

                    return (
                      <div
                        key={preset.id}
                        className="group flex flex-col rounded-xl border border-border bg-surface hover:border-accent hover:shadow-lg transition-all overflow-hidden"
                      >
                        {/* Card Header */}
                        <div className="p-4 border-b border-border/50">
                          <h3 className="font-semibold text-foreground truncate text-base">{preset.name}</h3>
                          <p className="text-xs text-muted mt-1">{preset.cpu_family}</p>
                        </div>

                        {/* Price Section */}
                        <div className="px-4 pt-3 pb-2">
                          <p className="text-sm font-bold text-accent">{formatTzs(preset.total_tzs)}</p>
                        </div>

                        {/* Category Badge */}
                        <div className="px-4 pb-3">
                          <div className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-full border text-xs font-medium ${categoryColor}`}>
                            {categoryConfig[categories[0]]?.icon}
                            <span>{categoryConfig[categories[0]]?.label}</span>
                          </div>
                        </div>

                        {/* Specs Section */}
                        <div className="px-4 py-3 bg-surface/50 space-y-2 flex-1">
                          <p className="text-xs font-semibold text-muted uppercase tracking-wide">Quick Specs</p>
                          <div className="space-y-1.5">
                            <p className="text-xs text-foreground line-clamp-1" title={cpu}>
                              <span className="text-muted">CPU:</span> {cpu}
                            </p>
                            <p className="text-xs text-foreground line-clamp-1" title={gpu}>
                              <span className="text-muted">GPU:</span> {gpu}
                            </p>
                            {highlights.map((h, i) => (
                              <p key={i} className="text-xs text-foreground">
                                • {h}
                              </p>
                            ))}
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="border-t border-border/50 p-3 space-y-2">
                          <button
                            type="button"
                            onClick={() => handleUsePreset(preset)}
                            disabled={isLoading}
                            className="w-full px-3 py-2.5 rounded-lg bg-accent text-accent-foreground font-semibold text-sm hover:bg-accent/90 transition disabled:opacity-50"
                          >
                            Use This Build
                          </button>
                          <button
                            type="button"
                            onClick={() => handleViewDetails(preset)}
                            className="w-full px-3 py-2 rounded-lg border border-border text-foreground text-sm hover:bg-surface/80 transition"
                          >
                            Details
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Navigation Arrows */}
              {carouselItems.length > visibleCount && (
                <>
                  <button
                    onClick={handlePrevious}
                    disabled={safeIndex === 0}
                    className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-5 sm:-translate-x-6 p-2 rounded-full bg-surface border border-border hover:bg-surface/80 transition disabled:opacity-30 disabled:cursor-not-allowed"
                    aria-label="Previous builds"
                  >
                    <ChevronLeft className="h-5 w-5 text-foreground" />
                  </button>
                  <button
                    onClick={handleNext}
                    disabled={safeIndex >= maxIndex}
                    className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-5 sm:translate-x-6 p-2 rounded-full bg-surface border border-border hover:bg-surface/80 transition disabled:opacity-30 disabled:cursor-not-allowed"
                    aria-label="Next builds"
                  >
                    <ChevronRight className="h-5 w-5 text-foreground" />
                  </button>
                </>
              )}

              {/* Pagination Dots */}
              {carouselItems.length > visibleCount && (
                <div className="flex justify-center gap-2 mt-5">
                  {Array.from({ length: Math.ceil(carouselItems.length / (visibleCount - 1)) }).map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setCarouselIndex(i * (visibleCount - 1))}
                      className={`h-2 rounded-full transition ${
                        i === Math.floor(safeIndex / (visibleCount - 1))
                          ? 'bg-accent w-6'
                          : 'bg-border w-2 hover:bg-border/70'
                      }`}
                      aria-label={`Go to page ${i + 1}`}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      ) : null}

      {/* Details Modal */}
      <Modal
        open={detailsOpen}
        onClose={() => setDetailsOpen(false)}
        title={selectedPreset?.name}
        className="w-full max-w-2xl max-h-[90vh] overflow-y-auto"
      >
        {selectedPreset && (
          <div className="space-y-6">
            {/* Price & Category */}
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted">Total Price</p>
                <p className="text-3xl font-bold text-accent mt-1">{formatTzs(selectedPreset.total_tzs)}</p>
              </div>
              {selectedPreset.compatibility_status && selectedPreset.compatibility_status !== 'valid' && (
                <div className={`inline-flex items-center px-3 py-1.5 rounded-full border text-xs font-medium gap-2 ${
                  selectedPreset.compatibility_status === 'warning'
                    ? 'bg-warning/10 text-warning border-warning/30'
                    : 'bg-danger/10 text-danger border-danger/30'
                }`}>
                  {selectedPreset.compatibility_status === 'warning' ? '⚠️' : '❌'} {selectedPreset.compatibility_status}
                </div>
              )}
            </div>

            {/* CPU & GPU Summary */}
            <div className="space-y-3 p-4 bg-surface/50 rounded-lg">
              <p className="text-sm font-semibold text-foreground">Performance Summary</p>
              <div className="space-y-2">
                <p className="text-sm text-foreground">
                  <span className="text-muted">CPU:</span> {getCpuGpu(selectedPreset).cpu}
                </p>
                <p className="text-sm text-foreground">
                  <span className="text-muted">GPU:</span> {getCpuGpu(selectedPreset).gpu}
                </p>
              </div>
            </div>

            {/* Full Component List */}
            <div className="space-y-3">
              <p className="text-sm font-semibold text-foreground">Complete Component List</p>
              <div className="space-y-2">
                {selectedPreset.pc_build_preset_items && selectedPreset.pc_build_preset_items.length > 0 ? (
                  selectedPreset.pc_build_preset_items.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-start p-2 bg-surface/30 rounded border border-border/30">
                      <div className="flex-1">
                        <p className="text-xs text-muted capitalize">{item.component_type}</p>
                        <p className="text-sm text-foreground font-medium">{item.pc_components?.name || 'N/A'}</p>
                      </div>
                      {item.pc_components?.price_tzs && (
                        <p className="text-sm text-accent font-semibold">{formatTzs(item.pc_components.price_tzs)}</p>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted">No components listed</p>
                )}
              </div>
            </div>

            {/* Action */}
            <button
              type="button"
              onClick={() => handleUsePreset(selectedPreset)}
              disabled={isLoading}
              className="w-full px-4 py-3 rounded-lg bg-accent text-accent-foreground font-semibold hover:bg-accent/90 transition disabled:opacity-50"
            >
              Use This Build
            </button>
          </div>
        )}
      </Modal>
    </div>
  );
}
