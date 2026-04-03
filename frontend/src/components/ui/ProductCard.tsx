import { motion } from 'framer-motion';
import { Heart, Plus, ShoppingBag } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import type { Product } from '../../types/api';
import { clampText, compactText, titleCase } from '../../lib/format';
import { getProductImage, placeholderForProduct } from '../../utils/imageFallback';
import { ConditionBadge } from './ConditionBadge';
import { PriceDisplay } from './PriceDisplay';
import { StockBadge } from './StockBadge';

type ProductCardProps = {
  product: Product;
  inWishlist?: boolean;
  onToggleWishlist?: (product: Product) => void;
  onQuickAdd?: (productId: string) => void;
};

export function ProductCard({ product, inWishlist, onToggleWishlist, onQuickAdd }: ProductCardProps) {
  const soldOut = product.stock_status === 'sold_out';
  const fallbackImage = useMemo(() => placeholderForProduct(product), [product]);
  const [imageSrc, setImageSrc] = useState(() => getProductImage(product));

  useEffect(() => {
    setImageSrc(getProductImage(product));
  }, [product]);

  return (
    <motion.article
      layout
      whileHover={{ y: -2 }}
      transition={{ duration: 0.18 }}
      className="group flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-surface"
    >
      <Link to={`/products/${product.slug}`} className="relative block overflow-hidden bg-gradient-to-br from-surfaceElevated to-surface p-3">
        <div className="relative aspect-[4/3] overflow-hidden rounded-xl border border-border/70 bg-surfaceElevated text-center">
          <img
            src={imageSrc}
            alt={product.title}
            loading="lazy"
            className="h-full w-full object-cover"
            onError={(event) => {
              if (event.currentTarget.src.endsWith(fallbackImage)) return;
              setImageSrc(fallbackImage);
            }}
          />
          <div className="absolute inset-x-0 bottom-0 bg-black/45 px-3 py-2 text-left backdrop-blur-[1px]">
            <p className="text-[10px] uppercase tracking-widest text-white/80">{titleCase(product.product_type)}</p>
            <p className="mt-1 text-sm font-semibold text-white">{clampText(product.title, 52)}</p>
          </div>
        </div>
        <button
          type="button"
          aria-label={inWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
          onClick={(event) => {
            event.preventDefault();
            onToggleWishlist?.(product);
          }}
          className="absolute right-5 top-5 inline-flex min-h-9 min-w-9 items-center justify-center rounded-full border border-border bg-background/85 text-muted backdrop-blur transition hover:text-foreground"
        >
          <Heart className={`h-4 w-4 ${inWishlist ? 'fill-current text-danger' : ''}`} />
        </button>
      </Link>

      <div className="flex flex-1 flex-col p-3">
        <div className="flex flex-wrap items-center gap-2">
          <ConditionBadge condition={product.condition} />
          {product.stock_status !== 'in_stock' ? <StockBadge stockStatus={product.stock_status} /> : null}
        </div>

        <Link to={`/products/${product.slug}`} className="mt-3 text-sm font-semibold leading-5 text-foreground transition group-hover:text-accent">
          {product.title}
        </Link>

        <p className="mt-1 text-xs uppercase tracking-wide text-muted">{product.brand} • {titleCase(product.product_type)}</p>
        <p className="mt-2 text-xs text-muted">{clampText(compactText(product.short_description, 'Premium hardware for serious workflows.'), 72)}</p>

        <div className="mt-4 flex items-end justify-between gap-2">
          <PriceDisplay amount={product.estimated_price_tzs} className="text-base font-semibold" />
          <div className="flex items-center gap-1">
            <Link
              to={`/products/${product.slug}`}
              className="inline-flex min-h-11 items-center gap-1 rounded-full border border-border px-3 text-xs font-semibold uppercase tracking-wide text-foreground transition hover:border-accent hover:text-accent"
            >
              <Plus className="h-3.5 w-3.5" />
              Details
            </Link>
            <button
              type="button"
              disabled={soldOut}
              onClick={() => onQuickAdd?.(product.id)}
              className="inline-flex min-h-11 items-center gap-1 rounded-full bg-primary px-3 text-xs font-semibold uppercase tracking-wide text-primaryForeground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ShoppingBag className="h-3.5 w-3.5" />
              Add
            </button>
          </div>
        </div>
      </div>
    </motion.article>
  );
}
