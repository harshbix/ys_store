import type { Product } from '../../types/api';
import { ProductCard } from './ProductCard';

type ProductGridProps = {
  products: Product[];
  isInWishlist: (productId: string) => boolean;
  onToggleWishlist: (product: Product) => void;
  onQuickAdd: (productId: string) => void;
  addingProductId?: string | null;
};

export function ProductGrid({ products, isInWishlist, onToggleWishlist, onQuickAdd, addingProductId = null }: ProductGridProps) {
  return (
    <div className="grid grid-cols-2 gap-px bg-border md:grid-cols-3 xl:grid-cols-4">
      {products.map((product) => (
        <ProductCard
          key={product.id}
          product={product}
          inWishlist={isInWishlist(product.id)}
          onToggleWishlist={onToggleWishlist}
          onQuickAdd={onQuickAdd}
          addingToCart={addingProductId === product.id}
        />
      ))}
    </div>
  );
}
