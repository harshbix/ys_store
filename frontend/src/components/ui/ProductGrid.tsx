import { m as motion } from 'framer-motion';
import type { Product } from '../../types/api';
import { ProductCard } from './ProductCard';
import { fadeInUp } from '../../lib/motion';

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
      {products.map((product, idx) => (
        <motion.div 
          key={product.id} 
          variants={fadeInUp} 
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "50px" }}
          transition={{ duration: 0.3, delay: Math.min(idx * 0.05, 0.3) }}
          className="bg-surface h-full"
        >
          <ProductCard
            product={product}
            inWishlist={isInWishlist(product.id)}
            onToggleWishlist={onToggleWishlist}
            onQuickAdd={onQuickAdd}
            addingToCart={addingProductId === product.id}
          />
        </motion.div>
      ))}
    </div>
  );
}
