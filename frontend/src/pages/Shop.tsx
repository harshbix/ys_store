import { useProducts } from '../api/hooks';
import { ProductCard } from '../components/ui/ProductCard';

export const Shop = () => {
  const { data, isLoading, error } = useProducts({ limit: 50, status: 'active' });

  return (
    <div className="animate-fade-in flex flex-col md:flex-row gap-12">
      <aside className="w-full md:w-64 flex-shrink-0">
        <div className="sticky top-24 space-y-8">
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider mb-4 border-b border-border pb-2">Filter</h3>
            <ul className="space-y-4 text-sm text-muted">
              <li>Category <span className="float-right">+</span></li>
              <li>Brand <span className="float-right">+</span></li>
              <li>Price <span className="float-right">+</span></li>
            </ul>
          </div>
        </div>
      </aside>

      <div className="flex-1">
        <div className="mb-8 flex justify-between items-end border-b border-border pb-6">
          <h1 className="text-3xl font-light tracking-tight">Gaming Hardware</h1>
          <span className="text-sm text-muted">{data?.total || 0} Results</span>
        </div>

        {error ? (
          <div className="p-8 border border-red-500/20 bg-red-500/10 text-red-500 rounded-md">Error loading hardware. Please retry.</div>
        ) : isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-10">
            {[...Array(6)].map((_, i) => <div key={i} className="aspect-[4/5] bg-surfaceElevated animate-pulse rounded-md" />)}
          </div>
        ) : data?.items?.length === 0 ? (
          <div className="py-20 text-center text-muted">No products found.</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-10">
            {data?.items.map((product: any) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};