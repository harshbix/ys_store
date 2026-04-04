import { Heart, ShoppingBag } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import type { Product } from '../../types/api';
import { compactText, titleCase } from '../../lib/format';
import { getProductImage, placeholderForProduct } from '../../utils/imageFallback';
import { Button } from './Button';
import { ConditionBadge } from './ConditionBadge';
import { PriceDisplay } from './PriceDisplay';

type ProductCardProps = {
  product: Product;
  inWishlist?: boolean;
  onToggleWishlist?: (product: Product) => void;
  onQuickAdd?: (productId: string) => void;
  addingToCart?: boolean;
};

export function ProductCard({ product, inWishlist, onToggleWishlist, onQuickAdd, addingToCart = false }: ProductCardProps) {
  const soldOut = product.stock_status === 'sold_out';
  const fallbackImage = useMemo(() => placeholderForProduct(product), [product]);
  const [imageSrc, setImageSrc] = useState(() => getProductImage(product));
  const specLine = useMemo(() => compactText(product.model_name || product.brand || product.product_type).toUpperCase(), [product.brand, product.model_name, product.product_type]);

  useEffect(() => {
    setImageSrc(getProductImage(product));
  }, [product]);

  return (
    <article className="group flex h-full flex-col bg-surface">
      <Link to={`/products/${product.slug}`} className="relative block overflow-hidden bg-surface">
        <div className="relative aspect-[4/5] overflow-hidden bg-surface">
          <img
            src={imageSrc}
            alt={product.title}
            loading="lazy"
            className="h-full w-full object-contain px-6 py-4 transition-transform duration-300 group-hover:scale-[1.03]"
            onError={(event) => {
              if (event.currentTarget.src.endsWith(fallbackImage)) return;
              setImageSrc(fallbackImage);
            }}
          />
          <div className="absolute left-2 top-2">
            <ConditionBadge condition={product.condition} />
          </div>
          <button
            type="button"
            aria-label={inWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
            onClick={(event) => {
              event.preventDefault();
              onToggleWishlist?.(product);
            }}
            className="absolute right-2 top-2 inline-flex h-8 w-8 items-center justify-center border border-border bg-background/90 text-secondary opacity-0 transition hover:text-foreground group-hover:opacity-100"
          >
            <Heart className={`h-3.5 w-3.5 ${inWishlist ? 'fill-current text-accent' : ''}`} />
          </button>
          <span className="label-11 absolute bottom-2 left-2 text-[10px] text-secondary opacity-0 transition group-hover:opacity-100">Quick View</span>
        </div>
      </Link>

      <div className="flex flex-1 flex-col px-2 pb-3 pt-3">
        <p className="font-mono text-[11px] uppercase tracking-[0.09em] text-muted">{specLine || titleCase(product.product_type)}</p>

        <Link to={`/products/${product.slug}`} className="product-name-clamp mt-2 text-[14px] font-normal leading-5 text-foreground">
          {product.title}
        </Link>

        <p className="mt-1 text-[12px] text-secondary">{compactText(product.short_description, product.brand)}</p>

        <div className="mt-3 flex items-center justify-between gap-2">
          <PriceDisplay amount={product.estimated_price_tzs} className="font-mono text-[14px] font-medium text-foreground" />
          <Button
            size="sm"
            variant="secondary"
            loading={addingToCart}
            disabled={soldOut || addingToCart}
            onClick={() => onQuickAdd?.(product.id)}
            className="h-8 w-8 px-0"
            aria-label="Add to cart"
          >
            <ShoppingBag className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </article>
  );
}
