import { Heart, ShoppingBag } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import type { Product } from '../../types/api';
import { compactText, titleCase } from '../../lib/format';
import { getProductImage, placeholderForProduct } from '../../utils/imageFallback';
import { ConditionBadge } from './ConditionBadge';
import { PriceDisplay } from './PriceDisplay';
import { Image } from './Image';
import { Card, CardContent, CardFooter } from './card';
import { Button } from './Button';
import { Badge } from './badge';

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
    <Card className="group flex h-full flex-col overflow-hidden border-none shadow-none bg-surface rounded-none">
      <Link to={`/products/${product.slug}`} className="relative block overflow-hidden bg-surface">
        <div className="relative aspect-[4/5] overflow-hidden bg-surface">
          <Image
            src={imageSrc}
            alt={product.title}
            fallbackSrc={fallbackImage}
            disableLazy={false}
            className="h-full w-full object-contain px-6 py-4 transition-transform duration-300 group-hover:scale-[1.03] bg-transparent"
          />
          <div className="absolute left-2 top-2">
            <ConditionBadge condition={product.condition} />
          </div>
          <Button
            variant="ghost"
            size="icon"
            aria-label={inWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
            onClick={(event) => {
              event.preventDefault();
              onToggleWishlist?.(product);
            }}
            className="absolute right-2 top-2 h-8 w-8 rounded-full border border-border bg-background/90 text-secondary opacity-0 transition hover:text-foreground group-hover:opacity-100 hover:bg-background/90"
          >
            <Heart className={`h-3.5 w-3.5 ${inWishlist ? 'fill-current text-destructive' : ''}`} />
          </Button>
          <span className="label-11 absolute bottom-2 left-2 text-[10px] text-secondary opacity-0 transition group-hover:opacity-100">Quick View</span>
        </div>
      </Link>

      <CardContent className="flex flex-1 flex-col p-2! pt-3!">
        <p className="text-[11px] font-mono uppercase tracking-[0.09em] text-muted-foreground">{specLine || titleCase(product.product_type)}</p>

        <h3 className="mt-2 text-[14px] font-normal leading-5">
          <Link to={`/products/${product.slug}`} className="line-clamp-2 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring">
            {product.title}
          </Link>
        </h3>

        <p className="mt-1 text-[12px] text-muted-foreground">{compactText(product.short_description, product.brand)}</p>
      </CardContent>

      <CardFooter className="p-2! pt-0! flex items-center justify-between gap-2 mt-auto">
        <PriceDisplay amount={product.estimated_price_tzs} className="font-mono text-[14px] font-medium" />
        <Button
          size="icon"
          variant="secondary"
          disabled={soldOut || addingToCart}
          onClick={() => onQuickAdd?.(product.id)}
          className="h-8 w-8 shrink-0"
          aria-label="Add to cart"
        >
          <ShoppingBag className="h-4 w-4" />
        </Button>
      </CardFooter>
    </Card>
  );
}
