import { motion } from 'framer-motion';
import { ArrowRight, BadgeCheck, MessageCircle, ShieldCheck, Truck } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { ErrorState } from '../components/feedback/ErrorState';
import { EmptyState } from '../components/feedback/EmptyState';
import { SkeletonGrid } from '../components/feedback/SkeletonGrid';
import { ProductGrid } from '../components/ui/ProductGrid';
import { Button } from '../components/ui/Button';
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

export default function HomePage() {
  const navigate = useNavigate();
  const productsQuery = useProducts({
    page: 1,
    limit: 8,
    sort: 'newest'
  });
  const { addItem } = useCart();
  const { isInWishlist, toggle } = useWishlist();

  const products = productsQuery.data?.data.items || [];
  const addingProductId = addItem.isPending ? (addItem.variables?.product_id ?? null) : null;

  return (
    <div className="space-y-20 pb-24 md:space-y-28">
      {/* HERO SECTION */}
      <section className="grid gap-8 md:grid-cols-2 md:items-center md:gap-12">
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="space-y-6"
        >
          <motion.h1
            variants={fadeInUp}
            className="text-[44px] font-light leading-[1.1] tracking-[-0.02em] text-foreground sm:text-[56px] lg:text-[72px]"
          >
            Serious tech,
            <br />
            done right.
          </motion.h1>

          <motion.p
            variants={fadeInUp}
            className="max-w-xl text-[15px] leading-7 text-secondary sm:text-[16px]"
          >
            Premium gaming systems curated and ready to ship.
          </motion.p>

          <motion.div variants={fadeInUp} className="flex flex-wrap gap-3">
            <Button size="lg" onClick={() => navigate('/shop')}>
              Products
              <ArrowRight className="h-4 w-4" />
            </Button>
            <Button size="lg" variant="secondary" onClick={() => navigate('/builder')}>
              Build your PC
            </Button>
          </motion.div>
        </motion.div>

        <motion.div
          variants={fadeInUp}
          className="relative overflow-hidden rounded-2xl border border-border/30 bg-gradient-to-br from-slate-900/30 to-black/30 h-80"
        >
          <img
            src="/hero/gaming-pc-minimal.jpg"
            alt="Gaming setup"
            className="h-full w-full object-cover"
          />
        </motion.div>
      </section>

      {/* FEATURED PRODUCTS */}
      <section className="space-y-8">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="text-center">
          <p className="text-[12px] font-medium tracking-[0.1em] text-secondary uppercase">Featured</p>
          <h2 className="mt-2 text-[32px] font-light text-foreground">Latest listings</h2>
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
          <p className="text-[12px] font-medium tracking-[0.1em] text-secondary uppercase">Shop by</p>
          <h2 className="mt-2 text-[32px] font-light text-foreground">Category</h2>
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
                className="group relative flex h-32 items-end justify-start overflow-hidden rounded-xl border border-border/20 bg-gradient-to-tr from-slate-900/40 to-slate-900/10 p-6 transition duration-300 hover:border-border/40 hover:bg-gradient-to-tr hover:from-slate-850 hover:to-slate-900/20"
              >
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/20 pointer-events-none" />
                <div className="relative">
                  <h3 className="text-[16px] font-medium text-foreground">{item.label}</h3>
                  <div className="mt-2 flex items-center gap-1.5 text-[12px] text-accent opacity-0 transition group-hover:opacity-100">
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
          className="border-t border-b border-border/20 py-12"
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
                    <Icon className="h-5 w-5 text-accent" />
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
            <h2 className="text-[40px] font-light text-foreground">Ready?</h2>
          </div>

          <div className="flex flex-wrap justify-center gap-3">
            <Button size="lg" onClick={() => navigate('/shop')}>
              Products
            </Button>
            <a
              href="https://wa.me/255700000000"
              target="_blank"
              rel="noreferrer"
              className="inline-flex min-h-12 items-center rounded-lg bg-success px-6 text-[14px] font-medium text-primaryForeground transition hover:opacity-90"
            >
              Chat on WhatsApp
            </a>
          </div>
        </motion.div>
      </section>
    </div>
  );
}
