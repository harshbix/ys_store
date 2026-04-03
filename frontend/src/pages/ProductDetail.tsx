import { useParams, useNavigate } from 'react-router-dom';
import { useProduct, useAddToCart } from '../api/hooks';
import { ShoppingBag, Loader2 } from 'lucide-react';
import { useState } from 'react';

export const ProductDetail = () => {
  const { id } = useParams<{ id: string }>(); // Slugs or UUID string map directly from params
  const navigate = useNavigate();
  const { data: product, isLoading, error } = useProduct(id!);
  const { mutateAsync: addToCart, isPending } = useAddToCart();
  const [qty, setQty] = useState(1);

  if (isLoading) return <div className="py-40 text-center animate-pulse uppercase tracking-widest text-muted">Loading Spec...</div>;
  if (error || !product) return <div className="py-40 text-center text-red-500 uppercase tracking-widest">Product Not Found</div>;

  const handleAdd = async () => {
    await addToCart({ product_id: product.id, quantity: qty, item_type: 'product' });
    navigate('/cart');
  };

  const formatCurrency = (val: string) => new Intl.NumberFormat('en-TZ', { style: 'currency', currency: 'TZS' }).format(Number(val));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 animate-fade-in max-w-6xl mx-auto">
      <div className="bg-surface rounded-md aspect-square flex items-center justify-center p-12">
        <img 
          src={product.media_urls?.[0] || 'https://via.placeholder.com/600'} 
          alt={product.name} 
          className="object-contain w-full h-full mix-blend-screen"
        />
      </div>
      
      <div className="space-y-10 pt-8">
        <div>
          <p className="text-xs uppercase tracking-widest text-muted mb-4">{product.category} • {product.condition.replace(/_/g, ' ')}</p>
          <h1 className="text-4xl lg:text-5xl font-light tracking-tight mb-4">{product.name}</h1>
          <p className="text-3xl font-bold">{formatCurrency(product.base_price)}</p>
        </div>

        <div className="prose prose-invert prose-sm text-muted">
          <p>{product.description}</p>
        </div>

        {product.specs && Object.keys(product.specs).length > 0 && (
          <div className="border-t border-border pt-8">
            <h3 className="text-sm uppercase tracking-widest font-bold mb-6">Technical Specifications</h3>
            <dl className="space-y-4 text-sm">
              {Object.entries(product.specs).map(([key, val]) => (
                <div key={key} className="grid grid-cols-3 gap-4 border-b border-border pb-4 last:border-0 last:pb-0">
                  <dt className="text-muted uppercase tracking-wider">{key.replace(/_/g, ' ')}</dt>
                  <dd className="col-span-2 font-medium">{String(val)}</dd>
                </div>
              ))}
            </dl>
          </div>
        )}

        <div className="flex gap-4 items-end pt-8 border-t border-border">
          <div className="space-y-2">
             <label className="text-xs uppercase text-muted tracking-wider">QTY</label>
             <select value={qty} onChange={e => setQty(Number(e.target.value))} className="block w-24 bg-surface border border-border outline-none py-4 px-4 font-mono select-none">
               {[1,2,3,4,5].map(n => <option key={n} value={n}>{n}</option>)}
             </select>
          </div>
          <button 
            disabled={isPending || product.stock_status === 'sold_out'}
            onClick={handleAdd}
            className="flex-1 bg-white text-black hover:bg-gray-200 transition-colors uppercase tracking-widest font-bold py-4 flex items-center justify-center gap-3 disabled:opacity-50"
          >
            {isPending ? <Loader2 className="w-5 h-5 animate-spin"/> : <><ShoppingBag className="w-5 h-5" /> {product.stock_status === 'sold_out' ? 'Out of Stock' : 'Add to Bag'}</>}
          </button>
        </div>
      </div>
    </div>
  );
};