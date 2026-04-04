import { motion } from 'framer-motion';
import { BadgeCheck, Cpu, Gamepad2, Laptop, MoveDown, Sparkles, Truck, Wrench } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { formatTzs } from '../lib/currency';
import { fadeInUp, staggerContainer } from '../lib/motion';
import { getFixtureProducts } from '../fixtures/products';
import { getProductImage } from '../utils/imageFallback';
import { cn } from '../lib/cn';

type Spotlight = {
  x: number;
  y: number;
};

type FeaturedBuild = {
  name: string;
  spec: string;
  price: number;
  href: string;
  productImage: string;
  tone: 'blue' | 'purple' | 'cyan' | 'gold';
};

const shortcutLinks = [
  { label: 'Gaming PCs', href: '/shop?type=desktop', icon: Gamepad2 },
  { label: 'Laptops', href: '/shop?type=laptop', icon: Laptop },
  { label: 'Components', href: '/shop?type=component', icon: Cpu }
] as const;

const valueBlocks = [
  { title: 'Fast Delivery', text: 'Dar es Salaam priority, nationwide follow-through.', icon: Truck },
  { title: 'Expert Builds', text: 'Compatibility checked before quote approval.', icon: Wrench },
  { title: 'Verified Parts', text: 'Curated stock with clear condition tags.', icon: BadgeCheck },
  { title: 'WhatsApp Support', text: 'Human help when decisions need context.', icon: Sparkles }
] as const;

function toneClass(tone: FeaturedBuild['tone']): string {
  switch (tone) {
    case 'blue':
      return 'from-cyan-500/20 via-sky-500/10 to-transparent';
    case 'purple':
      return 'from-violet-500/20 via-fuchsia-500/10 to-transparent';
    case 'cyan':
      return 'from-cyan-400/20 via-cyan-500/10 to-transparent';
    case 'gold':
      return 'from-amber-400/20 via-orange-400/10 to-transparent';
  }
}

function buildFeaturedBuilds(): FeaturedBuild[] {
  const products = getFixtureProducts();
  const desktop = products.find((product) => product.product_type === 'desktop');
  const laptop = products.find((product) => product.product_type === 'laptop');
  const component = products.find((product) => product.product_type === 'component');
  const accessory = products.find((product) => product.product_type === 'accessory');

  return [
    {
      name: 'Titan 4070',
      spec: 'RTX 4070 • 32GB DDR5',
      price: desktop?.estimated_price_tzs || 3450000,
      href: desktop ? `/products/${desktop.slug}` : '/builder',
      productImage: desktop ? getProductImage(desktop) : '/placeholders/desktop.svg',
      tone: 'blue'
    },
    {
      name: 'A16 4060',
      spec: 'RTX 4060 • 165Hz panel',
      price: laptop?.estimated_price_tzs || 2890000,
      href: laptop ? `/products/${laptop.slug}` : '/builder',
      productImage: laptop ? getProductImage(laptop) : '/placeholders/laptop.svg',
      tone: 'purple'
    },
    {
      name: '4070 Super Core',
      spec: 'GPU upgrade • 1440p ready',
      price: component?.estimated_price_tzs || 1850000,
      href: component ? `/products/${component.slug}` : '/builder',
      productImage: component ? getProductImage(component) : '/placeholders/component.svg',
      tone: 'cyan'
    },
    {
      name: 'Vision 27',
      spec: '27" QHD • 165Hz',
      price: accessory?.estimated_price_tzs || 520000,
      href: accessory ? `/products/${accessory.slug}` : '/builder',
      productImage: accessory ? getProductImage(accessory) : '/placeholders/accessory.svg',
      tone: 'gold'
    }
  ];
}

function FeaturedBuildCard({ build }: { build: FeaturedBuild }) {
  return (
    <motion.div
      whileHover={{ y: -6, scale: 1.01 }}
      transition={{ type: 'spring', stiffness: 280, damping: 26 }}
      className="group relative overflow-hidden border border-border bg-surface"
    >
      <div className={cn('pointer-events-none absolute inset-0 bg-gradient-to-br opacity-0 transition duration-300 group-hover:opacity-100', toneClass(build.tone))} />
      <Link to={build.href} className="relative block">
        <div className="relative aspect-[4/5] overflow-hidden bg-background">
          <img
            src={build.productImage}
            alt={build.name}
            loading="lazy"
            className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.05]"
          />
          <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-background to-transparent" />
          <div className="absolute left-4 top-4 inline-flex items-center rounded-full border border-border bg-background/80 px-2.5 py-1 text-[10px] uppercase tracking-[0.16em] text-secondary backdrop-blur">
            Featured Build
          </div>
        </div>

        <div className="space-y-2 p-4">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-[16px] font-medium text-foreground">{build.name}</h3>
            <span className="font-mono text-[14px] text-foreground">{formatTzs(build.price)}</span>
          </div>
          <p className="text-[12px] text-secondary">{build.spec}</p>
          <p className="text-[11px] uppercase tracking-[0.14em] text-muted">Open build</p>
        </div>
      </Link>
    </motion.div>
  );
}

export default function HomePage() {
  const navigate = useNavigate();
  const heroRef = useRef<HTMLElement | null>(null);
  const featuredBuilds = useMemo(() => buildFeaturedBuilds(), []);
  const [spotlight, setSpotlight] = useState<Spotlight>({ x: 68, y: 24 });

  useEffect(() => {
    const element = heroRef.current;
    if (!element) return;

    const handlePointerMove = (event: PointerEvent) => {
      const rect = element.getBoundingClientRect();
      const nextX = ((event.clientX - rect.left) / rect.width) * 100;
      const nextY = ((event.clientY - rect.top) / rect.height) * 100;
      setSpotlight({
        x: Math.min(100, Math.max(0, nextX)),
        y: Math.min(100, Math.max(0, nextY))
      });
    };

    const handlePointerLeave = () => setSpotlight({ x: 68, y: 24 });

    element.addEventListener('pointermove', handlePointerMove);
    element.addEventListener('pointerleave', handlePointerLeave);

    return () => {
      element.removeEventListener('pointermove', handlePointerMove);
      element.removeEventListener('pointerleave', handlePointerLeave);
    };
  }, []);

  const scrollToFeaturedBuilds = () => {
    document.getElementById('featured-builds')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="space-y-14 pb-10 md:space-y-20">
      <section
        ref={heroRef}
        className="relative flex min-h-[calc(100svh-52px)] items-center overflow-hidden border border-border bg-background px-4 py-6 sm:px-6 lg:px-8"
      >
        <div
          className="pointer-events-none absolute inset-0 transition-[background-position] duration-150 ease-out"
          style={{
            backgroundImage: `radial-gradient(circle at ${spotlight.x}% ${spotlight.y}%, rgba(59, 130, 246, 0.18), transparent 30%), radial-gradient(circle at ${100 - spotlight.x}% ${100 - spotlight.y}%, rgba(168, 85, 247, 0.16), transparent 26%), linear-gradient(180deg, rgba(4,6,10,0.98) 0%, rgba(7,10,16,1) 100%)`
          }}
        />
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.035)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.035)_1px,transparent_1px)] bg-[size:72px_72px] opacity-25 [mask-image:radial-gradient(circle_at_center,black,transparent_78%)]" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_35%,rgba(0,0,0,0.34)_100%)]" />

        <div className="relative mx-auto grid w-full max-w-[1440px] items-center gap-10 lg:grid-cols-[1fr_520px] lg:gap-12">
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className="max-w-2xl"
          >
            <motion.p variants={fadeInUp} className="label-11 text-secondary">
              Premium gaming hardware
            </motion.p>
            <motion.h1
              variants={fadeInUp}
              className="mt-4 max-w-xl text-[42px] font-light leading-[0.98] tracking-[-0.04em] text-foreground sm:text-[56px] lg:text-[72px]"
            >
              Build Power.
            </motion.h1>
            <motion.p variants={fadeInUp} className="mt-5 max-w-lg text-[13px] leading-6 text-secondary sm:text-[14px]">
              Engineered systems, curated parts, and WhatsApp support from first click to final quote.
            </motion.p>

            <motion.div variants={fadeInUp} className="mt-7 flex flex-wrap gap-3">
              <Button size="lg" onClick={() => navigate('/builder')} className="min-w-[160px]">
                Build Your PC
              </Button>
              <Button size="lg" variant="secondary" onClick={scrollToFeaturedBuilds} className="min-w-[160px]">
                Explore Builds
              </Button>
            </motion.div>

            <motion.div variants={fadeInUp} className="mt-8 flex items-center gap-3 text-[11px] uppercase tracking-[0.16em] text-muted">
              <span className="h-px w-10 bg-border" />
              <span>Dar es Salaam • Tanzania • WhatsApp-first</span>
            </motion.div>
          </motion.div>

          <motion.div
            variants={fadeInUp}
            initial="hidden"
            animate="visible"
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="relative mx-auto w-full max-w-[520px]"
            style={{
              transform: 'translate3d(0, 0, 0)'
            }}
          >
            <div
              className="absolute inset-0 rounded-[28px] bg-gradient-to-br from-cyan-500/12 via-violet-500/10 to-transparent blur-3xl"
              style={{ transform: 'translate3d(0, 0, 0)' }}
            />
            <div className="relative overflow-hidden rounded-[28px] border border-white/10 bg-white/[0.03] p-4 shadow-[0_24px_80px_rgba(0,0,0,0.45)] backdrop-blur-xl">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div>
                  <p className="label-11 text-secondary">Cinematic build</p>
                  <p className="mt-1 text-[14px] font-medium text-foreground">Featured system preview</p>
                </div>
                <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] text-secondary">
                  <span className="h-2 w-2 rounded-full bg-cyan-400 shadow-[0_0_20px_rgba(34,211,238,0.9)]" />
                  Live ready
                </span>
              </div>

              <div className="relative mt-4 overflow-hidden rounded-[24px] border border-white/10 bg-[#071019] p-3">
                <motion.img
                  src={featuredBuilds[0].productImage}
                  alt={featuredBuilds[0].name}
                  loading="lazy"
                  className="h-[340px] w-full object-cover object-center opacity-90"
                  animate={{ y: [0, -6, 0] }}
                  transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
                  style={{
                    transform: `translate3d(${(spotlight.x - 50) / 18}px, ${(spotlight.y - 50) / 20}px, 0)`
                  }}
                />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_35%,rgba(4,6,10,0.64)_100%)]" />
                <div className="absolute bottom-3 left-3 right-3 grid gap-2 sm:grid-cols-3">
                  {[
                    'GPU first',
                    'Quiet thermals',
                    'Quote ready'
                  ].map((item) => (
                    <div key={item} className="rounded-full border border-white/10 bg-black/40 px-3 py-2 text-center text-[11px] text-secondary backdrop-blur">
                      {item}
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-4 grid gap-px overflow-hidden rounded-[20px] border border-white/10 bg-white/10 text-[12px]">
                <div className="grid grid-cols-[1fr_auto] items-center bg-background/95 px-4 py-3">
                  <span className="text-secondary">Price</span>
                  <span className="font-mono text-foreground">{formatTzs(featuredBuilds[0].price)}</span>
                </div>
                <div className="grid grid-cols-[1fr_auto] items-center bg-background/95 px-4 py-3">
                  <span className="text-secondary">Experience</span>
                  <span className="text-foreground">Premium / Fast / Responsive</span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        <div className="pointer-events-none absolute bottom-4 left-1/2 z-[1] -translate-x-1/2 text-center text-[10px] uppercase tracking-[0.28em] text-secondary">
          <div className="mx-auto flex h-9 w-9 items-center justify-center rounded-full border border-border bg-background/70 backdrop-blur">
            <MoveDown className="h-4 w-4 animate-bounce" />
          </div>
          <p className="mt-2">Scroll</p>
        </div>
      </section>

      <motion.section
        id="featured-builds"
        variants={staggerContainer}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
        className="space-y-5"
      >
        <motion.div variants={fadeInUp} className="flex items-end justify-between gap-3">
          <div>
            <p className="label-11 text-secondary">Featured Builds</p>
            <h2 className="mt-2 text-[22px] font-light tracking-[-0.03em] text-foreground sm:text-[28px]">Visual-first presets</h2>
          </div>
          <Link to="/builder" className="label-11 text-[11px] font-normal text-secondary transition hover:text-foreground">
            Open Builder
          </Link>
        </motion.div>

        <div className="grid auto-cols-[minmax(280px,1fr)] grid-flow-col gap-4 overflow-x-auto pb-2 md:grid-flow-row md:grid-cols-2 xl:grid-cols-4">
          {featuredBuilds.map((build, index) => (
            <motion.div key={build.name} variants={fadeInUp} transition={{ delay: index * 0.04 }}>
              <FeaturedBuildCard build={build} />
            </motion.div>
          ))}
        </div>
      </motion.section>

      <motion.section
        variants={staggerContainer}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.25 }}
        className="grid gap-6 border border-border bg-surface p-5 lg:grid-cols-[1fr_420px] lg:p-7"
      >
        <motion.div variants={fadeInUp} className="max-w-xl">
          <p className="label-11 text-secondary">PC Builder</p>
          <h2 className="mt-3 text-[26px] font-light tracking-[-0.04em] text-foreground sm:text-[34px]">
            Design Your Machine
          </h2>
          <p className="mt-3 max-w-lg text-[13px] leading-6 text-secondary">
            Choose a direction, validate compatibility, and move straight into a guided quote flow.
          </p>
          <div className="mt-6">
            <Button size="lg" onClick={() => navigate('/builder')}>
              Start Building
            </Button>
          </div>
        </motion.div>

        <motion.div variants={fadeInUp} className="relative min-h-[260px] overflow-hidden rounded-[24px] border border-border bg-background p-5">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(59,130,246,0.16),transparent_35%),radial-gradient(circle_at_bottom_left,rgba(168,85,247,0.12),transparent_32%)]" />
          <div className="relative grid h-full gap-3 sm:grid-cols-2">
            {[
              { label: 'CPU', tone: 'bg-cyan-500/15 text-cyan-300', offset: 'sm:translate-y-6' },
              { label: 'GPU', tone: 'bg-violet-500/15 text-violet-300', offset: 'sm:-translate-y-2' },
              { label: 'RAM', tone: 'bg-sky-500/15 text-sky-300', offset: 'sm:translate-y-3' },
              { label: 'Case', tone: 'bg-white/8 text-secondary', offset: 'sm:-translate-y-6' }
            ].map((part, index) => (
              <motion.div
                key={part.label}
                animate={{ y: [0, -4, 0], opacity: [0.9, 1, 0.9] }}
                transition={{ duration: 6 + index, repeat: Infinity, ease: 'easeInOut' }}
                className={cn('flex items-center justify-between rounded-[18px] border border-border bg-surface px-4 py-4 text-[12px]', part.offset)}
              >
                <span className={cn('rounded-full px-3 py-1 font-medium', part.tone)}>{part.label}</span>
                <span className="text-muted">assembling</span>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </motion.section>

      <motion.section
        variants={staggerContainer}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
        className="grid grid-cols-1 gap-3 sm:grid-cols-3"
      >
        {shortcutLinks.map((item) => {
          const Icon = item.icon;
          return (
            <motion.div key={item.label} variants={fadeInUp} whileHover={{ y: -4, scale: 1.01 }} transition={{ type: 'spring', stiffness: 260, damping: 24 }}>
              <Link
                to={item.href}
                className="group flex min-h-24 flex-col justify-between border border-border bg-surface p-4 transition hover:border-accent/50 hover:bg-surfaceElevated"
              >
                <Icon className="h-5 w-5 text-secondary transition group-hover:text-accent" />
                <span className="mt-6 text-[14px] font-medium text-foreground">{item.label}</span>
              </Link>
            </motion.div>
          );
        })}
      </motion.section>

      <motion.section
        variants={staggerContainer}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
        className="grid gap-3 md:grid-cols-2 xl:grid-cols-4"
      >
        {valueBlocks.map((block, index) => {
          const Icon = block.icon;
          return (
            <motion.div
              key={block.title}
              variants={fadeInUp}
              transition={{ delay: index * 0.04 }}
              className="border border-border bg-surface p-4"
            >
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-background text-accent">
                  <Icon className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-[13px] font-medium text-foreground">{block.title}</p>
                  <p className="mt-1 text-[12px] leading-5 text-secondary">{block.text}</p>
                </div>
              </div>
            </motion.div>
          );
        })}
      </motion.section>

      <motion.section
        variants={fadeInUp}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.25 }}
        className="relative overflow-hidden border border-border bg-surface px-5 py-10 sm:px-8"
      >
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(59,130,246,0.16),transparent_28%),radial-gradient(circle_at_bottom_left,rgba(168,85,247,0.14),transparent_30%)]" />
        <div className="relative flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
          <div>
            <p className="label-11 text-secondary">Final Call</p>
            <h2 className="mt-3 text-[28px] font-light tracking-[-0.04em] text-foreground sm:text-[38px]">
              Ready to Upgrade?
            </h2>
          </div>
          <Button size="lg" onClick={() => navigate('/builder')}>
            Start Now
          </Button>
        </div>
      </motion.section>
    </div>
  );
}
