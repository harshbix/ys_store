import { AnimatePresence, motion } from 'framer-motion';
import { ChevronRight, Heart } from 'lucide-react';
import { type ReactNode, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useCart } from '../hooks/useCart';
import { useProductDetail, useProducts } from '../hooks/useProducts';
import { useWishlist } from '../hooks/useWishlist';
import { formatTzs } from '../lib/currency';
import { compactText, titleCase } from '../lib/format';
import { getProductImage, placeholderForProduct } from '../utils/imageFallback';
import { ConditionBadge } from '../components/ui/ConditionBadge';
import { ErrorState } from '../components/feedback/ErrorState';
import { ProductCard } from '../components/ui/ProductCard';
import { Button } from '../components/ui/Button';
import { SkeletonGrid } from '../components/feedback/SkeletonGrid';
import { StockBadge } from '../components/ui/StockBadge';

function specText(spec: { value_text: string | null; value_number: number | null; value_bool: boolean | null }): string {
  if (spec.value_text) return spec.value_text;
  if (typeof spec.value_number === 'number') return String(spec.value_number);
  if (typeof spec.value_bool === 'boolean') return spec.value_bool ? 'Yes' : 'No';
  return '-';
}

type AccordionKey = 'specs' | 'description' | 'shipping' | 'warranty';

function findSpecValue(specs: Array<{ spec_key: string; value_text: string | null; value_number: number | null; value_bool: boolean | null }>, keys: string[]): string {
  const matched = specs.find((spec) => keys.some((key) => spec.spec_key.toLowerCase().includes(key)));
  return matched ? specText(matched) : '-';
}

export default function ProductDetailPage() {
  const navigate = useNavigate();
  const { slug } = useParams();
  const detailQuery = useProductDetail(slug);
  const { addItem } = useCart();
  const { isInWishlist, toggle } = useWishlist();
  const [activeAccordion, setActiveAccordion] = useState<AccordionKey | null>('specs');
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [activeImage, setActiveImage] = useState<string>('');

  const product = detailQuery.data;

  const relatedQuery = useProducts({
    type: product?.product_type,
    page: 1,
    limit: 4,
    sort: 'newest'
  });

  const relatedProducts = useMemo(() => {
    if (!product) return [];
    return (relatedQuery.data?.items ?? []).filter((item) => item.id !== product.id).slice(0, 4);
  }, [product, relatedQuery.data?.items]);

  const galleryImages = useMemo(() => {
    if (!product) return [];

    const mediaImages = (product.media || [])
      .map((media) => media.full_url || media.original_url || media.thumb_url)
      .filter((value): value is string => Boolean(value));

    if (mediaImages.length > 0) return mediaImages;

    return [getProductImage(product)];
  }, [product]);

  useEffect(() => {
    if (!galleryImages.length) return;
    setActiveImage(galleryImages[0]);
  }, [galleryImages]);

  if (detailQuery.isLoading) {
    return <SkeletonGrid count={4} />;
  }

  if (detailQuery.isError || !product) {
    return <ErrorState title="Product unavailable" description="This product could not be loaded." onRetry={() => detailQuery.refetch()} />;
  }

  const displayImage = activeImage || getProductImage(product);
  const cpuPreview = findSpecValue(product.specs, ['cpu']);
  const gpuPreview = findSpecValue(product.specs, ['gpu']);
  const ramPreview = findSpecValue(product.specs, ['ram', 'memory']);

  const accordionRows: Array<{ key: AccordionKey; title: string; content: ReactNode }> = [
    {
      key: 'specs',
      title: 'Specifications',
      content: (
        <div className="space-y-2 text-[13px] text-secondary">
          {product.specs.length === 0 ? <p>No specification rows listed.</p> : null}
          {product.specs.map((spec) => (
            <div key={`${spec.id}-${spec.spec_key}`} className="grid grid-cols-[140px_1fr] gap-4 border-b border-border py-2 last:border-b-0">
              <span className="label-11 text-secondary">{titleCase(spec.spec_key)}</span>
              <span className="text-foreground">{specText(spec)} {spec.unit || ''}</span>
            </div>
          ))}
        </div>
      )
    },
    {
      key: 'description',
      title: 'Description',
      content: <p className="text-[13px] leading-6 text-secondary">{compactText(product.long_description, 'No additional product description available yet.')}</p>
    },
    {
      key: 'shipping',
      title: 'Shipping',
      content: <p className="text-[13px] leading-6 text-secondary">Delivery coordination and pickup support are available across Tanzania, with cross-border options handled via WhatsApp follow-up.</p>
    },
    {
      key: 'warranty',
      title: 'Warranty',
      content: <p className="text-[13px] leading-6 text-secondary">{compactText(product.warranty_text, 'Warranty terms are shared by support at quote confirmation.')}</p>
    }
  ];

  return (
    <div className="space-y-8 pb-24 md:space-y-10">
      <Button size="sm" variant="secondary" onClick={() => navigate(-1)}>
        Back
      </Button>
      <section className="grid gap-8 lg:grid-cols-[58%_42%]">
        <div className="space-y-4">
          <div className="bg-surface p-3 md:p-4">
            <button
              type="button"
              onClick={() => setLightboxOpen(true)}
              className="relative block w-full overflow-hidden bg-surfaceElevated"
              aria-label="Open product image"
            >
              <div className="aspect-[4/5] bg-surface">
                <img
                  src={displayImage}
                  alt={product.title}
                  className="h-full w-full object-contain px-6 py-4"
                  onError={(event) => {
                    const fallback = placeholderForProduct(product);
                    if (event.currentTarget.src.endsWith(fallback)) return;
                    event.currentTarget.src = fallback;
                  }}
                />
              </div>
            </button>

            <div className="mt-3 flex gap-2 overflow-x-auto">
              {galleryImages.map((image, index) => (
                <button
                  key={`${image}-${index}`}
                  type="button"
                  onClick={() => setActiveImage(image)}
                  className={`h-16 w-14 shrink-0 border ${image === displayImage ? 'border-foreground' : 'border-border'}`}
                  aria-label={`View image ${index + 1}`}
                >
                  <img
                    src={image}
                    alt={`${product.title} thumbnail ${index + 1}`}
                    className="h-full w-full object-contain bg-surface"
                    onError={(event) => {
                      const fallback = placeholderForProduct(product);
                      if (event.currentTarget.src.endsWith(fallback)) return;
                      event.currentTarget.src = fallback;
                    }}
                  />
                </button>
              ))}
            </div>
          </div>

          <div className="border-t border-border">
            {accordionRows.map((row) => {
              const isOpen = activeAccordion === row.key;
              return (
                <section key={row.key} className="border-b border-border">
                  <button
                    type="button"
                    onClick={() => setActiveAccordion(isOpen ? null : row.key)}
                    className="flex h-12 w-full items-center justify-between text-left"
                  >
                    <span className="text-[13px] font-normal text-foreground">{row.title}</span>
                    <ChevronRight className={`h-4 w-4 text-secondary transition-transform duration-200 ${isOpen ? 'rotate-90' : ''}`} />
                  </button>

                  <AnimatePresence initial={false}>
                    {isOpen ? (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25 }}
                        className="overflow-hidden"
                      >
                        <div className="pb-4">{row.content}</div>
                      </motion.div>
                    ) : null}
                  </AnimatePresence>
                </section>
              );
            })}
          </div>
        </div>

        <aside className="lg:sticky lg:top-[76px] lg:h-fit">
          <div className="space-y-4">
            <p className="text-[11px] text-muted">Home / Shop / {product.title}</p>
            <p className="label-11 text-secondary">{titleCase(product.product_type)} / {product.brand}</p>
            <h1 className="text-[22px] font-light leading-[1.2] text-foreground">{product.title}</h1>

            <div className="flex flex-wrap items-center gap-2">
              <ConditionBadge condition={product.condition} />
              <StockBadge stockStatus={product.stock_status} />
            </div>

            <p className="font-mono text-[20px] font-medium text-foreground">{formatTzs(product.estimated_price_tzs)}</p>

            <div className="flex flex-wrap gap-2">
              <span className="label-11 border border-border px-2 py-1 text-secondary">CPU: {cpuPreview}</span>
              <span className="label-11 border border-border px-2 py-1 text-secondary">GPU: {gpuPreview}</span>
              <span className="label-11 border border-border px-2 py-1 text-secondary">RAM: {ramPreview}</span>
            </div>

            <button
              type="button"
              onClick={() => addItem.mutate({ item_type: 'product', product_id: product.id, quantity: 1 })}
              className="h-12 w-full bg-primary px-5 text-[13px] font-medium text-primaryForeground"
            >
              Add to Cart
            </button>

            <div className="flex items-center gap-5 text-[13px] text-secondary">
              <button
                type="button"
                onClick={() => toggle({ id: product.id, slug: product.slug, title: product.title })}
                className="inline-flex items-center gap-2 transition hover:text-foreground"
              >
                <Heart className={`h-4 w-4 ${isInWishlist(product.id) ? 'fill-current text-accent' : ''}`} />
                Wishlist
              </button>

              <a href="https://wa.me/255700000000" target="_blank" rel="noreferrer" className="text-success transition hover:opacity-90">
                WhatsApp
              </a>
            </div>
          </div>
        </aside>
      </section>

      <section className="space-y-5">
        <h2 className="section-title text-foreground">You Might Also Like</h2>
        {relatedQuery.isLoading ? <SkeletonGrid count={4} /> : null}
        {relatedProducts.length > 0 ? (
          <div className="grid grid-cols-2 gap-px bg-border md:grid-cols-3 xl:grid-cols-4">
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

      <div className="fixed inset-x-0 bottom-[52px] z-30 border-t border-border bg-[rgba(17,17,17,0.97)] p-3 backdrop-blur md:hidden">
        <div className="mx-auto flex w-full max-w-[1440px] items-center gap-3">
          <p className="min-w-0 flex-1 truncate font-mono text-[14px] font-medium">{formatTzs(product.estimated_price_tzs)}</p>
          <button
            type="button"
            onClick={() => addItem.mutate({ item_type: 'product', product_id: product.id, quantity: 1 })}
            className="h-11 bg-primary px-6 text-[13px] font-medium text-primaryForeground"
          >
            Add to Cart
          </button>
        </div>
      </div>

      <AnimatePresence>
        {lightboxOpen ? (
          <>
            <motion.button
              type="button"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/85"
              onClick={() => setLightboxOpen(false)}
              aria-label="Close image viewer"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-4 z-[60] flex items-center justify-center"
            >
              <img
                src={displayImage}
                alt={product.title}
                className="max-h-full max-w-full object-contain"
                onError={(event) => {
                  const fallback = placeholderForProduct(product);
                  if (event.currentTarget.src.endsWith(fallback)) return;
                  event.currentTarget.src = fallback;
                }}
              />
            </motion.div>
          </>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
