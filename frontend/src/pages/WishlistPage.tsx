import { motion } from 'framer-motion';
import { EmptyState } from '../components/feedback/EmptyState';
import { ErrorState } from '../components/feedback/ErrorState';
import { ProductGrid } from '../components/ui/ProductGrid';
import { useCart } from '../hooks/useCart';
import { useWishlist } from '../hooks/useWishlist';

export default function WishlistPage() {
  const { products, wishlist, isInWishlist, toggle, removeFromWishlist, isLoading } = useWishlist();
  const { addItem } = useCart();

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5 pb-8">
      <header>
        <h1 className="font-display text-2xl font-semibold text-foreground">Wishlist</h1>
        <p className="mt-1 text-sm text-muted">Saved locally for this device and guest session continuity.</p>
      </header>

      {wishlist.length === 0 ? (
        <EmptyState title="No saved products yet" description="Use the heart icon on products to save them here." actionHref="/shop" actionLabel="Browse products" />
      ) : null}

      {isLoading ? <p className="text-sm text-muted">Loading saved products...</p> : null}

      {!isLoading && wishlist.length > 0 && products.length === 0 ? (
        <ErrorState title="Saved products not available" description="Some items may no longer be listed in the current catalog." />
      ) : null}

      {products.length > 0 ? (
        <ProductGrid
          products={products}
          isInWishlist={isInWishlist}
          onToggleWishlist={(product) => {
            if (isInWishlist(product.id)) {
              removeFromWishlist(product.id);
              return;
            }
            toggle({ id: product.id, slug: product.slug, title: product.title });
          }}
          onQuickAdd={(productId) => addItem.mutate({ item_type: 'product', product_id: productId, quantity: 1 })}
        />
      ) : null}
    </motion.div>
  );
}
