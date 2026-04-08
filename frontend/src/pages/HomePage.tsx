import { m as motion } from 'framer-motion';
import { ArrowRight, BadgeCheck, MessageCircle, ShieldCheck, Truck } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { ErrorState } from '../components/feedback/ErrorState';
import { EmptyState } from '../components/feedback/EmptyState';
import { SkeletonGrid } from '../components/feedback/SkeletonGrid';
import { ProductGrid } from '../components/ui/ProductGrid';
import { Button } from '../components/ui/Button';
import { Image } from '../components/ui/Image';
import { SEO } from '../components/seo/SEO';
import { useCart } from '../hooks/useCart';
import { useProducts } from '../hooks/useProducts';
import { useWishlist } from '../hooks/useWishlist';
import { fadeInUp, staggerContainer } from '../lib/motion';

const categoryShortcuts = [
  { label: 'Gaming Laptops', href: '/shop?type=laptop' },
  { label: 'Gaming Desktops', href: '/shop?type=desktop' },
  { label: 'Accessories', href: '/shop?type=accessory' },
  { label: 'Custom PC Build', href: '/builder' }
] as const;

const trustSignals = [
  { title: 'Genuine Products', icon: BadgeCheck },
  { title: 'Warranty', icon: ShieldCheck },
  { title: 'Dar es Salaam Delivery', icon: Truck },
  { title: 'WhatsApp Support', icon: MessageCircle }
] as const;

import { buildWhatsAppUrl } from '../utils/whatsapp';

export default function HomePage() {
  const navigate = useNavigate();
  const productsQuery = useProducts({
    page: 1,
    limit: 8,
    sort: 'newest'
  });
  const { addItem } = useCart();
  const { isInWishlist, toggle } = useWishlist();

  const products = productsQuery.data?.items ?? [];
  const addingProductId = addItem.isPending ? (addItem.variables?.product_id ?? null) : null;

  return (
    <div className="space-y-20 pb-24 md:space-y-28">
      <SEO 
        title="Gaming PCs & Laptops in Tanzania" 
        description="Experience peak performance with custom gaming PCs, laptops, and premium accessories. Delivered to you in Dar es Salaam."
      />
      {/* HERO SECTION */}
      <section className="relative overflow-hidden rounded-[2.25rem] border border-white/10 bg-[#06090f] px-5 py-10 shadow-[0_24px_90px_rgba(0,0,0,0.45)] sm:px-8 md:px-10 md:py-12 lg:px-12 lg:py-14">
        <div className="pointer-events-none absolute inset-0">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage:
                'radial-gradient(circle at 14% 18%, rgba(59,130,246,0.26), transparent 34%), radial-gradient(circle at 74% 20%, rgba(236,72,153,0.16), transparent 32%), radial-gradient(circle at 65% 78%, rgba(56,189,248,0.15), transparent 34%)'
            }}
          />
          <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(255,255,255,0.07),rgba(255,255,255,0)_24%,rgba(0,0,0,0.58))]" />
        </div>

        <div className="relative grid gap-8 lg:grid-cols-[1.12fr_0.88fr] lg:items-center">
          <motion.div 
            variants={fadeInUp} 
            initial="hidden" 
            animate="visible" 
            className="relative lg:order-last"
          >
            <div className="relative h-[420px] overflow-hidden rounded-[1.75rem] bg-black/20 sm:h-[500px]">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_22%,rgba(125,211,252,0.18),transparent_38%),radial-gradient(circle_at_80%_74%,rgba(236,72,153,0.16),transparent_36%)]" />
              <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/45" />

              <div className="absolute inset-3 rounded-[1.3rem] border border-white/15 bg-white/[0.04] backdrop-blur-[1.5px]" />
              <div className="pointer-events-none absolute left-8 top-8 z-10 h-[44%] w-[34%] rounded-[1.2rem] border border-white/20 bg-white/10 opacity-50 backdrop-blur-xl" />
              <div className="pointer-events-none absolute left-10 top-10 z-10 h-[1px] w-[25%] bg-white/70 blur-[0.6px]" />

              <Image
                src="/hero/desktop3.webp"
                alt="Gaming desktop"
                disableLazy={true}
                className="relative z-20 h-full w-full object-contain object-center p-4 sm:p-5 bg-transparent"
              />
            </div>

            <div className="mt-4 grid grid-cols-3 gap-2 text-[11px] text-secondary sm:gap-3 sm:text-[12px]">
              <div className="rounded-xl border border-white/15 bg-white/[0.04] px-3 py-2.5 backdrop-blur">
                <p className="uppercase tracking-[0.15em] text-muted">GPU</p>
                <p className="mt-1 text-[13px] text-foreground">RTX Class</p>
              </div>
              <div className="rounded-xl border border-white/15 bg-white/[0.04] px-3 py-2.5 backdrop-blur">
                <p className="uppercase tracking-[0.15em] text-muted">Build</p>
                <p className="mt-1 text-[13px] text-foreground">Custom Tuned</p>
              </div>
              <div className="rounded-xl border border-white/15 bg-white/[0.04] px-3 py-2.5 backdrop-blur">
                <p className="uppercase tracking-[0.15em] text-muted">Support</p>
                <p className="mt-1 text-[13px] text-foreground">WhatsApp Fast</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className="space-y-5 lg:pl-4"
          >
            <motion.p
              variants={fadeInUp}
              className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-sky-200 backdrop-blur"
            >
              <span className="h-2 w-2 rounded-full bg-sky-300 shadow-[0_0_14px_rgba(125,211,252,0.8)]" />
              New arrivals in stock
            </motion.p>

            <motion.h1
              variants={fadeInUp}
              className="max-w-[13ch] text-[38px] font-medium leading-[1.05] tracking-[-0.03em] text-foreground sm:text-[52px] lg:text-[62px]"
            >
              Beautiful machines for serious play.
            </motion.h1>

            <motion.p variants={fadeInUp} className="max-w-xl text-[15px] leading-7 text-secondary sm:text-[16px]">
              A minimal collection of gaming desktops, laptops, and accessories built for performance and designed to elevate your setup.
            </motion.p>

            <motion.div variants={fadeInUp} className="flex flex-wrap gap-3 pt-1">
              <Button
                size="lg"
                onClick={() => navigate('/shop')}
                className="rounded-full bg-white px-6 text-black shadow-[0_12px_30px_rgba(255,255,255,0.24)] hover:bg-slate-200"
              >
                Explore Products
                <ArrowRight className="h-4 w-4" />
              </Button>
              <Button
                size="lg"
                variant="secondary"
                onClick={() => navigate('/builder')}
                className="rounded-full border border-white/30 bg-white/[0.03] px-6 text-foreground backdrop-blur hover:bg-white/10"
              >
                Build Your PC
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* FEATURED PRODUCTS */}
      <section className="space-y-8">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="text-center">
          <p className="text-[12px] font-medium tracking-[0.12em] text-secondary uppercase">Featured</p>
          <h2 className="mt-2 text-[32px] font-light tracking-[-0.02em] text-foreground">Latest listings</h2>
        </motion.div>

        {productsQuery.isLoading ? <SkeletonGrid count={8} /> : null}
        {productsQuery.isError ? (
          <ErrorState
            title="Could not load products"
            description="Please check your connection and try again."
            onRetry={() => productsQuery.refetch()}
          />
        ) : null}
        {!productsQuery.isLoading && !productsQuery.isError && products.length === 0 ? (
          <EmptyState
            title="No products live yet"
            description="New products will appear here as soon as they are posted."
          />
        ) : null}

        {!productsQuery.isLoading && !productsQuery.isError && products.length > 0 ? (
          <ProductGrid
            products={products}
            isInWishlist={isInWishlist}
            onToggleWishlist={(product) => toggle({ id: product.id, slug: product.slug, title: product.title })}
            onQuickAdd={(productId) => addItem.mutate({ item_type: 'product', product_id: productId, quantity: 1 })}
            addingProductId={addingProductId}
          />
        ) : null}
      </section>

      {/* CATEGORY SHORTCUTS */}
      <section className="space-y-8">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="text-center">
          <p className="text-[12px] font-medium tracking-[0.12em] text-secondary uppercase">Shop by</p>
          <h2 className="mt-2 text-[32px] font-light tracking-[-0.015em] text-foreground">Category</h2>
        </motion.div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {categoryShortcuts.map((item, idx) => (
            <motion.div
              key={item.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: idx * 0.1 }}
            >
              <Link
                to={item.href}
                className="group relative flex h-32 items-end justify-start overflow-hidden rounded-xl border border-white/10 bg-gradient-to-tr from-slate-900/45 to-slate-900/10 p-6 transition duration-300 hover:border-white/20 hover:from-slate-800/50 hover:to-slate-900/25"
              >
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/5 via-transparent to-black/25" />
                <div className="relative">
                  <h3 className="text-[16px] font-medium text-foreground">{item.label}</h3>
                  <div className="mt-2 flex items-center gap-1.5 text-[12px] text-sky-300 opacity-0 transition group-hover:opacity-100">
                    Explore
                    <ArrowRight className="h-3 w-3" />
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </section>

      {/* TRUST STRIP */}
      <section>
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.6 }}
          className="rounded-2xl border border-border/30 bg-surface/35 px-6 py-10 backdrop-blur-lg md:px-8"
        >
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {trustSignals.map((signal, idx) => {
              const Icon = signal.icon;
              return (
                <motion.div
                  key={signal.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: idx * 0.1 }}
                  className="space-y-2"
                >
                  <div className="flex items-center gap-3">
                    <Icon className="h-5 w-5 text-sky-300" />
                    <h3 className="text-[14px] font-medium text-foreground">{signal.title}</h3>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      </section>

      {/* FINAL CTA */}
      <section>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="flex flex-col items-center gap-6 text-center"
        >
          <div className="space-y-3">
            <h2 className="text-[40px] font-light tracking-[-0.02em] text-foreground">Ready?</h2>
          </div>

          <div className="flex flex-wrap justify-center gap-3">
            <Button
              size="lg"
              onClick={() => navigate('/shop')}
              className="bg-white text-black shadow-[0_10px_24px_rgba(255,255,255,0.22)] hover:bg-slate-200"
            >
              Products
            </Button>
            <a
              href={buildWhatsAppUrl()}
              target="_blank"
              rel="noreferrer"
              className="inline-flex min-h-12 items-center rounded-lg border border-white/30 bg-white/5 px-6 text-[14px] font-medium text-foreground backdrop-blur transition hover:bg-white/10"
            >
              Chat on WhatsApp
            </a>
          </div>
        </motion.div>
      </section>
    </div>
  );
}

