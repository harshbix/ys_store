import { motion } from 'framer-motion';
import { Heart, ShoppingBag } from 'lucide-react';
import { useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { useCart } from '../hooks/useCart';
import { useProductDetail, useProducts } from '../hooks/useProducts';
import { useWishlist } from '../hooks/useWishlist';
import { formatTzs } from '../lib/currency';
import { compactText, titleCase } from '../lib/format';
import { getProductImage, placeholderForProduct } from '../utils/imageFallback';
import { Breadcrumb } from '../components/ui/Breadcrumb';
import { ConditionBadge } from '../components/ui/ConditionBadge';
import { ErrorState } from '../components/feedback/ErrorState';
import { ProductCard } from '../components/ui/ProductCard';
import { SkeletonGrid } from '../components/feedback/SkeletonGrid';
import { StockBadge } from '../components/ui/StockBadge';

function specText(spec: { value_text: string | null; value_number: number | null; value_bool: boolean | null }): string {
  if (spec.value_text) return spec.value_text;
  if (typeof spec.value_number === 'number') return String(spec.value_number);
  if (typeof spec.value_bool === 'boolean') return spec.value_bool ? 'Yes' : 'No';
  return '-';
}

export default function ProductDetailPage() {
  const { slug } = useParams();
  const detailQuery = useProductDetail(slug);
  const { addItem } = useCart();
  const { isInWishlist, toggle } = useWishlist();

  const product = detailQuery.data?.data;

  const relatedQuery = useProducts({
    type: product?.product_type,
    page: 1,
    limit: 4,
    sort: 'newest'
  });

  const relatedProducts = useMemo(() => {
    if (!product) return [];
    return (relatedQuery.data?.data.items || []).filter((item) => item.id !== product.id).slice(0, 4);
  }, [product, relatedQuery.data?.data.items]);

  if (detailQuery.isLoading) {
    return <SkeletonGrid count={4} />;
  }

  if (detailQuery.isError || !product) {
    return <ErrorState title="Product unavailable" description="This product could not be loaded." onRetry={() => detailQuery.refetch()} />;
  }

  const heroImage = getProductImage(product);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 pb-20">
      <Breadcrumb items={[{ label: 'Home', href: '/' }, { label: 'Shop', href: '/shop' }, { label: product.title }]} />

      <section className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-4">
          <div className="rounded-2xl border border-border bg-surface p-4">
            <div className="relative aspect-[4/3] overflow-hidden rounded-xl border border-border bg-surfaceElevated">
              <img
                src={heroImage}
                alt={product.title}
                className="h-full w-full object-cover"
                onError={(event) => {
                  const fallback = placeholderForProduct(product);
                  if (event.currentTarget.src.endsWith(fallback)) return;
                  event.currentTarget.src = fallback;
                }}
              />
              <div className="absolute inset-x-0 bottom-0 bg-black/45 p-4 backdrop-blur-[1px]">
                <p className="text-xs uppercase tracking-widest text-white/85">{titleCase(product.product_type)}</p>
                <h1 className="mt-2 font-display text-2xl font-semibold text-white">{product.title}</h1>
                <p className="mt-1 text-sm text-white/90">{compactText(product.short_description)}</p>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <ConditionBadge condition={product.condition} />
              <StockBadge stockStatus={product.stock_status} />
            </div>
          </div>

          <article className="rounded-2xl border border-border bg-surface p-4">
            <h2 className="text-base font-semibold text-foreground">Specification Summary</h2>
            <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
              <div className="rounded-lg border border-border bg-background p-3">
                <dt className="text-xs uppercase tracking-wide text-muted">Brand</dt>
                <dd className="mt-1 text-foreground">{product.brand}</dd>
              </div>
              <div className="rounded-lg border border-border bg-background p-3">
                <dt className="text-xs uppercase tracking-wide text-muted">Model</dt>
                <dd className="mt-1 text-foreground">{product.model_name}</dd>
              </div>
              {product.specs.slice(0, 4).map((spec) => (
                <div key={spec.id} className="rounded-lg border border-border bg-background p-3">
                  <dt className="text-xs uppercase tracking-wide text-muted">{titleCase(spec.spec_key)}</dt>
                  <dd className="mt-1 text-foreground">{specText(spec)}</dd>
                </div>
              ))}
            </dl>
          </article>

          {product.long_description ? (
            <article className="rounded-2xl border border-border bg-surface p-4">
              <h2 className="text-base font-semibold text-foreground">Description</h2>
              <p className="mt-3 whitespace-pre-line text-sm leading-6 text-muted">{product.long_description}</p>
            </article>
          ) : null}

          <article className="rounded-2xl border border-border bg-surface p-4">
            <h2 className="text-base font-semibold text-foreground">Full Specs</h2>
            <div className="mt-3 overflow-hidden rounded-xl border border-border">
              <table className="min-w-full divide-y divide-border text-sm">
                <tbody>
                  {product.specs.map((spec) => (
                    <tr key={`${spec.id}-${spec.spec_key}`} className="divide-x divide-border">
                      <th className="w-1/3 bg-background px-3 py-2 text-left font-medium text-muted">{titleCase(spec.spec_key)}</th>
                      <td className="px-3 py-2 text-foreground">{specText(spec)} {spec.unit || ''}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </article>
        </div>

        <aside className="space-y-4 lg:sticky lg:top-20 lg:self-start">
          <div className="rounded-2xl border border-border bg-surface p-5">
            <p className="text-xs uppercase tracking-wide text-muted">Price</p>
            <p className="mt-1 text-2xl font-semibold text-foreground">{formatTzs(product.estimated_price_tzs)}</p>
            <p className="mt-2 text-sm text-muted">Warranty: {compactText(product.warranty_text, 'Please ask for warranty details')}</p>

            <div className="mt-4 flex gap-2">
              <button
                type="button"
                onClick={() => addItem.mutate({ item_type: 'product', product_id: product.id, quantity: 1 })}
                className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-full bg-primary px-4 text-sm font-semibold text-primaryForeground"
              >
                <ShoppingBag className="h-4 w-4" />
                Add to Cart
              </button>
              <button
                type="button"
                onClick={() => toggle({ id: product.id, slug: product.slug, title: product.title })}
                className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-full border border-border"
                aria-label="Toggle wishlist"
              >
                <Heart className={`h-4 w-4 ${isInWishlist(product.id) ? 'fill-current text-danger' : ''}`} />
              </button>
            </div>

            <a
              href="https://wa.me/255700000000"
              target="_blank"
              rel="noreferrer"
              className="mt-3 inline-flex min-h-11 w-full items-center justify-center rounded-full border border-border px-4 text-sm font-semibold text-foreground hover:border-accent hover:text-accent"
            >
              WhatsApp Inquiry
            </a>
          </div>
        </aside>
      </section>

      <section className="space-y-3">
        <h2 className="font-display text-xl font-semibold">Related Products</h2>
        {relatedQuery.isLoading ? <SkeletonGrid count={4} /> : null}
        {relatedProducts.length > 0 ? (
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {relatedProducts.map((item) => (
              <ProductCard
                key={item.id}
                product={item}
                inWishlist={isInWishlist(item.id)}
                onToggleWishlist={(next) => toggle({ id: next.id, slug: next.slug, title: next.title })}
                onQuickAdd={(productId) => addItem.mutate({ item_type: 'product', product_id: productId, quantity: 1 })}
              />
            ))}
          </div>
        ) : null}
      </section>

      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-border bg-background/95 p-3 backdrop-blur lg:hidden">
        <div className="mx-auto flex max-w-7xl items-center gap-2">
          <p className="min-w-0 flex-1 truncate text-sm font-semibold">{formatTzs(product.estimated_price_tzs)}</p>
          <button
            type="button"
            onClick={() => addItem.mutate({ item_type: 'product', product_id: product.id, quantity: 1 })}
            className="min-h-11 rounded-full bg-primary px-5 text-sm font-semibold text-primaryForeground"
          >
            Add to Cart
          </button>
        </div>
      </div>
    </motion.div>
  );
}
