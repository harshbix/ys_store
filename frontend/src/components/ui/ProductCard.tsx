import { Link } from 'react-router-dom';
import { Product } from '../../types/api';
import { useStore } from '../../store/useStore';
import { Heart } from 'lucide-react';

export const ProductCard = ({ product }: { product: Product }) => {
  const { toggleWishlist, wishlist } = useStore();
  const formatCurrency = (val: string) => new Intl.NumberFormat('en-TZ', { style: 'currency', currency: 'TZS' }).format(Number(val));
  const isWishlisted = wishlist.includes(product.id);

  return (
    <div className="group cursor-pointer flex flex-col relative w-full">
      <Link to={`/products/${product.slug || product.id}`} className="absolute inset-0 z-0" aria-label={`View ${product.name}`} />
      
      <div className="relative aspect-[4/5] bg-surface mb-4 overflow-hidden rounded-md flex items-center justify-center p-8 group-hover:shadow-[inset_0_0_0_1px_rgba(255,255,255,0.1)] transition-all">
        <button 
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleWishlist(product.id); }}
          className="absolute top-4 right-4 z-10 p-2 opacity-0 group-hover:opacity-100 transition-opacity bg-background/80 rounded-full hover:bg-white hover:text-black"
        >
          <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-current text-white group-hover:text-black' : ''}`} />
        </button>
        {product.is_featured && <span className="absolute top-4 left-4 z-10 text-[10px] font-bold tracking-widest uppercase bg-white text-black px-2 py-1 rounded-full">Featured</span>}
        <img 
          src={product.media_urls?.[0] || 'https://via.placeholder.com/400?text=Hardware'} 
          alt={product.name} 
          className="object-contain w-full h-full group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />
      </div>
      <div>
        <div className="flex justify-between items-start gap-4">
          <h3 className="text-sm font-medium leading-tight truncate max-w-[80%]">{product.name}</h3>
          <p className="text-sm font-bold whitespace-nowrap">{formatCurrency(product.base_price)}</p>
        </div>
        <div className="flex items-center gap-3 mt-1 text-xs uppercase tracking-wider">
          <p className="text-muted">{product.category}</p>
          <p className={product.stock_status === 'sold_out' ? 'text-red-400' : 'text-green-400 opacity-80'}>
            {product.stock_status.replace(/_/g, ' ')}
          </p>
        </div>
      </div>
    </div>
  );
};