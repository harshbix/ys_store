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

// Professional SaaS color palette - WCAG AA compliant
const categoryConfig: Record<Category, { icon: React.ReactNode; label: string; color: string }> = {
  all: { icon: <Sparkles className="h-4 w-4" />, label: 'All', color: 'bg-muted text-foreground border-border hover:bg-accent hover:text-accent-foreground' },
  budget: { icon: <Zap className="h-4 w-4" />, label: 'Budget', color: 'bg-primary/10 text-primary border-primary/20 hover:bg-primary/20' },
  'mid-range': { icon: <Briefcase className="h-4 w-4" />, label: 'Mid-Range', color: 'bg-primary/10 text-primary border-primary/20 hover:bg-primary/20' },
  'high-end': { icon: <Award className="h-4 w-4" />, label: 'High-End', color: 'bg-primary/10 text-primary border-primary/20 hover:bg-primary/20' },
  gaming: { icon: <Gamepad2 className="h-4 w-4" />, label: 'Gaming', color: 'bg-primary/10 text-primary border-primary/20 hover:bg-primary/20' },
  editing: { icon: <Briefcase className="h-4 w-4" />, label: 'Editing', color: 'bg-primary/10 text-primary border-primary/20 hover:bg-primary/20' },
  streaming: { icon: <Gamepad2 className="h-4 w-4" />, label: 'Streaming', color: 'bg-primary/10 text-primary border-primary/20 hover:bg-primary/20' },
  value: { icon: <Award className="h-4 w-4" />, label: 'Best Value', color: 'bg-primary/10 text-primary border-primary/20 hover:bg-primary/20' }
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
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-3">
        <h2 className="text-4xl sm:text-3xl font-bold text-foreground">Pick a Starting Build</h2>
        <p className="text-base sm:text-sm text-muted max-w-2xl leading-relaxed">Browse curated PCs by price and performance. Start with one, then customize it however you want.</p>
      </div>

      {presetsQuery.isError ? (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 flex gap-3">
          <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5 flex-shrink-0" />
          <p className="text-sm text-destructive">Failed to load builds. Please try again.</p>
        </div>
      ) : null}

      {!presetsQuery.isLoading && allPresets.length === 0 ? (
        <p className="text-sm text-muted text-center py-16">No builds available right now.</p>
      ) : null}

      {!presetsQuery.isError && allPresets.length > 0 ? (
        <>
          {/* Filter Bar */}
          <div className="space-y-4 w-full">
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
                className="px-4 py-3 sm:py-2.5 min-h-12 sm:min-h-11 rounded-lg border border-border bg-background text-sm text-foreground outline-none ring-ring transition focus:ring-2 font-medium"
              >
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="name">Name A-Z</option>
              </select>
            </div>

            {/* Category Chips - Horizontal scroll on mobile */}
            <div 
              className="flex gap-2 overflow-x-auto pb-2 sm:flex-wrap w-full"
              style={{ paddingBottom: '0.5rem', scrollbarWidth: 'none', msOverflowStyle: 'none' }}
              // Webkit specific styling for hiding scrollbar is usually handled in global CSS, but inline guarantees no broken layout
            >
              <style>{`.hide-scrollbar::-webkit-scrollbar { display: none; }`}</style>
              <div className="flex flex-nowrap sm:flex-wrap gap-2 hide-scrollbar w-full min-w-max sm:min-w-0">
                {(Object.entries(categoryConfig) as Array<[Category, any]>).map(([category, config]) => (
                  <button
                    key={category}
                    onClick={() => {
                      setSelectedCategory(category);
                      setCarouselIndex(0);
                    }}
                    className={`flex flex-shrink-0 items-center gap-1.5 px-4 py-2.5 rounded-full border text-sm font-medium transition ${
                      selectedCategory === category
                        ? `${config.color.split(' hover:')[0]} border-current shadow-sm`
                        : `${config.color} border-border`
                    }`}
                    aria-pressed={selectedCategory === category}
                  >
                    {config.icon}
                    <span>{config.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Results Info */}
          <div className="flex items-center justify-between pt-2">
            <p className="text-sm font-medium text-muted-foreground">
              {filteredPresets.length} {filteredPresets.length === 1 ? 'build' : 'builds'}
            </p>
          </div>

          {/* Carousel Container */}
          {presetsQuery.isLoading ? (
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={`skeleton-${i}`} className="h-96 sm:h-80 animate-pulse rounded-xl border border-border bg-muted" />
              ))}
            </div>
          ) : filteredPresets.length === 0 ? (
            <div className="text-center py-16">
              <Filter className="h-14 w-14 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground text-lg">No builds match your filters</p>
              <p className="text-sm text-muted-foreground mt-2">Try adjusting your search or filters</p>
            </div>
          ) : (
            <div className="relative">
              {/* Carousel Grid */}
              <div className="overflow-hidden rounded-lg">
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
                        className="group flex flex-col rounded-xl border border-border bg-background hover:border-primary hover:shadow-lg dark:hover:shadow-primary/30 transition-all duration-200 overflow-hidden"
                      >
                        {/* Card Header */}
                        <div className="p-4 border-b border-border">
                          <h3 className="font-semibold text-foreground truncate text-base leading-tight">{preset.name}</h3>
                          <p className="text-xs text-muted-foreground mt-1.5 truncate">{preset.cpu_family}</p>
                        </div>

                        {/* Price Section */}
                        <div className="px-4 pt-4 pb-2">
                          <p className="text-sm text-muted-foreground font-medium">Total Price</p>
                          <p className="text-2xl font-bold text-primary mt-1">{formatTzs(preset.total_tzs)}</p>
                        </div>

                        {/* Category Badge */}
                        <div className="px-4 pb-3">
                          <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-semibold ${categoryColor}`}>
                            {categoryConfig[categories[0]]?.icon}
                            <span>{categoryConfig[categories[0]]?.label}</span>
                          </div>
                        </div>

                        {/* Specs Section */}
                        <div className="px-4 py-3.5 bg-muted/50 border-y border-border space-y-3 flex-1">
                          <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Quick Specs</p>
                          <div className="space-y-2.5">
                            <p className="text-sm text-foreground line-clamp-1" title={cpu}>
                              <span className="text-muted-foreground font-medium">CPU:</span> {cpu}
                            </p>
                            <p className="text-sm text-foreground line-clamp-1" title={gpu}>
                              <span className="text-muted-foreground font-medium">GPU:</span> {gpu}
                            </p>
                            {highlights.map((h, i) => (
                              <p key={i} className="text-sm text-foreground">
                                <span className="text-primary font-bold">•</span> {h}
                              </p>
                            ))}
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="p-3 space-y-2.5">
                          <button
                            type="button"
                            onClick={() => handleUsePreset(preset)}
                            disabled={isLoading}
                            className="w-full px-4 py-3 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 font-semibold text-sm transition duration-150 disabled:opacity-60 disabled:cursor-not-allowed shadow-sm hover:shadow-md"
                          >
                            Use This Build
                          </button>
                          <button
                            type="button"
                            onClick={() => handleViewDetails(preset)}
                            className="w-full px-4 py-3 rounded-lg border-2 border-border text-foreground hover:bg-accent active:bg-accent font-semibold text-sm transition duration-150"
                          >
                            Details
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Navigation Arrows - Hidden on mobile */}
              {carouselItems.length > visibleCount && (
                <>
                  <button
                    onClick={handlePrevious}
                    disabled={safeIndex === 0}
                    className="hidden sm:flex absolute left-0 top-1/2 -translate-y-1/2 -translate-x-6 p-2.5 rounded-full bg-card border border-border hover:bg-accent transition disabled:opacity-40 disabled:cursor-not-allowed shadow-md"
                    aria-label="Previous builds"
                  >
                    <ChevronLeft className="h-6 w-6 text-foreground" />
                  </button>
                  <button
                    onClick={handleNext}
                    disabled={safeIndex >= maxIndex}
                    className="hidden sm:flex absolute right-0 top-1/2 -translate-y-1/2 translate-x-6 p-2.5 rounded-full bg-card border border-border hover:bg-accent transition disabled:opacity-40 disabled:cursor-not-allowed shadow-md"
                    aria-label="Next builds"
                  >
                    <ChevronRight className="h-6 w-6 text-foreground" />
                  </button>
                </>
              )}

              {/* Pagination Dots */}
              {carouselItems.length > visibleCount && (
                <div className="flex justify-center gap-2.5 mt-6 sm:mt-7">
                  {Array.from({ length: Math.ceil(carouselItems.length / (visibleCount - 1)) }).map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setCarouselIndex(i * (visibleCount - 1))}
                      className={`rounded-full transition duration-200 ${
                        i === Math.floor(safeIndex / (visibleCount - 1))
                          ? 'bg-primary w-8 h-3'
                          : 'bg-muted w-3 h-3 hover:bg-accent'
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
            {/* Price & Status */}
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Price</p>
                <p className="text-4xl font-bold text-primary mt-2">{formatTzs(selectedPreset.total_tzs)}</p>
              </div>
              {selectedPreset.compatibility_status && selectedPreset.compatibility_status !== 'valid' && (
                <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg border font-medium text-sm flex-shrink-0 ${
                  selectedPreset.compatibility_status === 'warning'
                    ? 'bg-yellow-50 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 border-yellow-200 dark:border-yellow-700/50'
                    : 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 border-red-200 dark:border-red-700/50'
                }`}>
                  {selectedPreset.compatibility_status === 'warning' ? '⚠️' : '❌'} {selectedPreset.compatibility_status}
                </div>
              )}
            </div>

            {/* CPU & GPU Summary */}
            <div className="space-y-3 p-4 bg-muted/50 rounded-lg border border-border">
              <p className="text-sm font-bold text-foreground uppercase tracking-wider">Performance Summary</p>
              <div className="space-y-3">
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Processor</p>
                  <p className="text-sm text-foreground font-medium mt-1">{getCpuGpu(selectedPreset).cpu}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Graphics</p>
                  <p className="text-sm text-foreground font-medium mt-1">{getCpuGpu(selectedPreset).gpu}</p>
                </div>
              </div>
            </div>

            {/* Full Component List */}
            <div className="space-y-3">
              <p className="text-sm font-bold text-foreground uppercase tracking-wider">Complete Build</p>
              <div className="space-y-2">
                {selectedPreset.pc_build_preset_items && selectedPreset.pc_build_preset_items.length > 0 ? (
                  selectedPreset.pc_build_preset_items.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-start p-3 bg-muted/50 rounded-lg border border-border hover:shadow-sm transition">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{item.component_type}</p>
                        <p className="text-sm text-foreground font-medium mt-1 truncate" title={item.pc_components?.name}>{item.pc_components?.name || 'N/A'}</p>
                      </div>
                      {item.pc_components?.price_tzs && (
                        <p className="text-sm font-bold text-primary ml-4 flex-shrink-0">{formatTzs(item.pc_components.price_tzs)}</p>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground py-8 text-center">No components listed</p>
                )}
              </div>
            </div>

            {/* Action */}
            <button
              type="button"
              onClick={() => handleUsePreset(selectedPreset)}
              disabled={isLoading}
              className="w-full px-4 py-4 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 font-bold text-base transition duration-150 disabled:opacity-60 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
            >
              {isLoading ? 'Loading...' : 'Use This Build'}
            </button>
          </div>
        )}
      </Modal>
    </div>
  );
}
