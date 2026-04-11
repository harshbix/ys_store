import { m as motion } from 'framer-motion';
import { Badge } from '../ui/badge';
import { Button } from '../ui/Button';
import { Card, CardContent } from '../ui/card';
import { formatTzs } from '../../lib/currency';
import { fadeInUp, TRANSITIONS } from '../../lib/motion';
import type { AdminProduct } from '../../types/admin';

interface AdminProductTileProps {
  product: AdminProduct;
  onEdit: (productId: string) => void;
  onDelete: (productId: string) => void;
}

export function AdminProductTile({ product, onEdit, onDelete }: AdminProductTileProps) {
  const media = Array.isArray(product.media) ? product.media : [];
  const primary = media.find((entry) => entry.is_primary) || media[0];
  const imageUrl = primary?.thumb_url || primary?.full_url || primary?.original_url || null;

  return (
    <motion.div variants={fadeInUp} whileHover={{ y: -2, scale: 1.005 }} transition={TRANSITIONS.FAST_EASE}>
      <Card className="h-full overflow-hidden border-border/80 bg-surface/90">
        <div className="h-36 w-full bg-background">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={product.title}
              className="h-full w-full object-cover"
              loading="lazy"
              onError={(event) => {
                event.currentTarget.src = '/placeholders/desktop.svg';
              }}
            />
          ) : (
            <div className="flex h-full items-center justify-center text-xs text-muted">No image</div>
          )}
        </div>

        <CardContent className="flex h-[220px] flex-col gap-2 p-4">
          <div className="flex items-start justify-between gap-2">
            <p className="line-clamp-2 text-sm font-semibold text-foreground">{product.title}</p>
            {product.is_featured ? <Badge>Featured</Badge> : null}
          </div>
          <p className="text-sm text-foreground">{formatTzs(product.estimated_price_tzs)}</p>
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary">{product.stock_status.replace(/_/g, ' ')}</Badge>
            {!product.is_visible ? <Badge variant="outline">Hidden</Badge> : null}
          </div>
          <div className="mt-auto flex flex-wrap gap-2 pt-2">
            <Button type="button" variant="outline" size="sm" onClick={() => onEdit(product.id)}>
              Edit
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={() => onDelete(product.id)}>
              Delete
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
