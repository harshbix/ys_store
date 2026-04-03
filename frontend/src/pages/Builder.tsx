import { useEffect } from 'react';
import { useStore } from '../store/useStore';
import { useCreateBuild, useGetBuild, useUpsertBuildItem, useRemoveBuildItem, useValidateBuild, useAddBuildToCart, useProducts } from '../api/hooks';
import { AlertTriangle, CheckCircle, Loader2, ArrowRight, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { formatCurrency } from '../utils/format';

const CATEGORIES = ['cpu', 'motherboard', 'gpu', 'ram', 'storage', 'psu', 'case', 'cooler'];

export const Builder = () => {
  const navigate = useNavigate();
  const { currentBuildId, setCurrentBuildId } = useStore();
  const { mutateAsync: createBuild, isPending: isCreating } = useCreateBuild();
  const { data: currentBuild, isLoading: isLoadingBuild } = useGetBuild(currentBuildId);
  const { mutateAsync: upsertItem } = useUpsertBuildItem(currentBuildId || '');
  const { mutateAsync: removeItem } = useRemoveBuildItem(currentBuildId || '');
  const { mutateAsync: validateBuild, data: validation, isPending: isValidating, reset: resetValidation } = useValidateBuild(currentBuildId || '');
  const { mutateAsync: addToCart, isPending: isAdding } = useAddBuildToCart(currentBuildId || '');

  // Products fetched specifically for builder category selection modal
  // Real implementation would isolate this fetching lazily, but using useQuery here natively
  const { data: allProducts } = useProducts({ limit: 100, status: 'active' });

  useEffect(() => {
    if (!currentBuildId && !isCreating) {
      createBuild({ name: 'My Custom Build' }).then(res => setCurrentBuildId(res.id));
    }
  }, [currentBuildId, isCreating, createBuild, setCurrentBuildId]);

  const handleComponentSelect = async (component_type: string, productId: string) => {
    await upsertItem({ component_type, product_id: productId });
    resetValidation(); // Clear stale validation
  };

  const handleAddToCart = async () => {
    if (!currentBuildId) return;
    await addToCart();
    navigate('/cart');
  };

  if (!currentBuildId || isLoadingBuild || !currentBuild) {
    return <div className="py-40 text-center animate-pulse uppercase tracking-widest text-muted font-bold min-h-[70vh]">Initializing Secure Build Session...</div>;
  }

  const itemsMap = currentBuild.items.reduce((acc, curr) => ({ ...acc, [curr.component_type]: curr }), {} as Record<string, any>);

  return (
    <div className="flex flex-col lg:flex-row gap-16 animate-slide-up pb-32 max-w-7xl mx-auto min-h-[70vh]">
      <div className="flex-1 space-y-12 shrink-0 max-w-3xl">
        <div className="border-b border-border pb-8 flex items-end justify-between">
            <h1 className="text-4xl font-light tracking-tight">System Integrator</h1>
            <p className="text-muted text-xs uppercase tracking-wider font-mono">Build #{currentBuild.id.slice(0, 8)}</p>
        </div>
        
        {CATEGORIES.map(category => {
          const selectedItem = itemsMap[category];
          const availableProducts = allProducts?.items?.filter((p: any) => p.category.toLowerCase() === category.toLowerCase()) || [];

          return (
            <div key={category} className="border border-border p-8 rounded-sm bg-surface flex flex-col md:flex-row justify-between gap-6 transition-all hover:border-white group items-start md:items-center">
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-xs uppercase tracking-widest text-muted font-bold">{category}</h3>
                  {selectedItem && <span className="md:hidden text-sm font-bold tracking-tight">{formatCurrency(selectedItem.product.base_price)}</span>}
                </div>
                {selectedItem ? (
                  <div className="flex items-center gap-4">
                     <p className="font-medium text-lg leading-tight truncate max-w-xs">{selectedItem.product.name}</p>
                     <button onClick={() => removeItem(selectedItem.id)} className="text-muted hover:text-red-500 bg-background rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"><X className="w-4 h-4" /></button>
                  </div>
                ) : (
                  <select 
                    className="w-full bg-background border border-border px-4 py-4 uppercase text-xs font-bold tracking-widest outline-none focus:border-white transition-colors"
                    onChange={(e) => {
                      if (e.target.value) handleComponentSelect(category, e.target.value);
                    }}
                    value=""
                  >
                    <option value="" disabled>Select {category}</option>
                    {availableProducts.map((p: any) => (
                      <option key={p.id} value={p.id}>{p.name} — {formatCurrency(p.base_price)}</option>
                    ))}
                  </select>
                )}
              </div>
              
              <div className="hidden md:flex items-center gap-6">
                {selectedItem && <span className="text-lg font-bold tracking-tight">{formatCurrency(selectedItem.product.base_price)}</span>}
              </div>
            </div>
          );
        })}
      </div>

      <aside className="w-full lg:w-96 flex-shrink-0">
        <div className="sticky top-24 bg-surfaceElevated border border-border p-10 rounded-sm">
          <h2 className="text-xl font-bold mb-8 uppercase tracking-widest pb-4 border-b border-border text-center">Summary</h2>
          
          <div className="space-y-4 mb-8 text-sm">
            <div className="flex justify-between text-muted font-bold uppercase tracking-widest">
              <span>Parts Selected</span>
              <span>{currentBuild.items.length} / {CATEGORIES.length}</span>
            </div>
            <div className="border-t border-border border-dashed my-4"></div>
            <div className="flex justify-between items-end">
              <span className="font-bold uppercase tracking-wider text-muted">Total Power</span>
              <span className="text-3xl font-bold tracking-tighter">{formatCurrency(currentBuild.total_price)}</span>
            </div>
          </div>

          {validation?.issues?.length ? (
             <div className="bg-red-500/10 border border-red-500/50 text-red-500 p-6 rounded-sm mb-8">
               <div className="flex items-center gap-3 mb-4 font-bold uppercase tracking-widest text-xs border-b border-red-500/20 pb-3">
                 <AlertTriangle className="w-4 h-4 flex-shrink-0" /> Compatibility Alert
               </div>
               <ul className="text-xs space-y-2 font-mono">
                 {validation.issues.map((i, idx) => <li key={idx}>- {i.message}</li>)}
               </ul>
             </div>
          ) : validation?.is_valid ? (
             <div className="bg-green-500/10 border border-green-500/50 text-green-400 p-6 rounded-sm mb-8 flex items-center justify-center gap-3 text-xs uppercase tracking-widest font-bold">
               <CheckCircle className="w-4 h-4" /> Optimal Configuration
             </div>
          ) : null}

          <div className="space-y-4 pt-4 border-t border-border">
            <button 
              onClick={() => validateBuild()}
              disabled={isValidating || currentBuild.items.length === 0}
              className="w-full py-5 border border-border hover:border-white text-muted hover:text-white transition-all uppercase tracking-widest text-xs font-bold flex justify-center items-center gap-3 disabled:opacity-30 disabled:hover:border-border disabled:hover:text-muted"
            >
              {isValidating ? <Loader2 className="w-4 h-4 animate-spin flex-shrink-0" /> : 'Run Diagnostics'}
            </button>
            <button 
              onClick={handleAddToCart}
              disabled={isAdding || currentBuild.items.length === 0}
              className="w-full py-5 bg-white text-black hover:bg-gray-200 transition-colors uppercase tracking-widest text-xs font-bold flex justify-center items-center gap-3 shadow-[0_0_40px_rgba(255,255,255,0.1)] disabled:opacity-30 disabled:hover:bg-white"
            >
              {isAdding ? <Loader2 className="w-5 h-5 animate-spin flex-shrink-0" /> : <><ArrowRight className="w-5 h-5" /> Append To Cart</>}
            </button>
          </div>
          <p className="text-[10px] text-muted text-center mt-6 uppercase tracking-widest">Final quote confirmed via WhatsApp.</p>
        </div>
      </aside>
    </div>
  );
};
