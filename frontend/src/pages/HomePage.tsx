import { Link } from 'react-router-dom';
import { MapPin, ShieldCheck, Truck } from 'lucide-react';
import { ProductRail } from '../components/ui/ProductRail';
import { WhatsAppButton } from '../components/ui/WhatsAppButton';

const categories = [
  { label: 'Shop', href: '/shop' },
  { label: 'Desktops', href: '/shop?type=desktop' },
  { label: 'Laptops', href: '/shop?type=laptop' },
  { label: 'Parts', href: '/shop?type=component' },
  { label: 'Sale', href: '/shop?featured_tag=hot_deal' }
];

export default function HomePage() {
  return (
    <div className="space-y-10 pb-10 md:space-y-16">
      <section className="relative overflow-hidden border border-border bg-surface">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -right-16 -top-16 h-44 w-44 rounded-full bg-accent/10 blur-3xl" />
          <div className="absolute -bottom-20 left-1/3 h-52 w-52 rounded-full bg-primary/10 blur-3xl" />
        </div>

        <div className="relative grid gap-6 p-5 md:grid-cols-[1.15fr_0.85fr] md:gap-8 md:p-8">
          <div>
            <p className="label-11 text-secondary">YS STORE | TANZANIA</p>
            <h1 className="mt-3 text-[30px] font-light leading-[1.15] text-foreground md:text-[40px]">
              Premium PC shopping with
              <span className="block text-accent">human WhatsApp guidance</span>
            </h1>
            <p className="mt-4 max-w-xl text-[13px] leading-6 text-secondary">
              Discover trusted hardware, build with compatibility checks, and confirm final pricing through a quote-first flow.
              Built for Dar es Salaam and nationwide delivery support.
            </p>

            <div className="mt-6 flex flex-wrap gap-2">
              <Link to="/shop" className="inline-flex h-11 items-center bg-primary px-5 text-[13px] font-medium text-primaryForeground">
                Explore Inventory
              </Link>
              <Link to="/builder" className="inline-flex h-11 items-center border border-border px-5 text-[13px] font-medium text-foreground">
                Start Custom Build
              </Link>
              <WhatsAppButton
                href="https://wa.me/255700000000"
                label="Talk on WhatsApp"
                className="inline-flex h-11 items-center gap-2 border border-border px-5 text-[13px] font-medium text-success"
              />
            </div>

            <div className="mt-6 grid grid-cols-3 gap-px border border-border bg-border text-[11px] uppercase tracking-[0.08em] text-muted">
              <div className="bg-background px-3 py-2.5">Quote-first checkout</div>
              <div className="bg-background px-3 py-2.5">TZS pricing clarity</div>
              <div className="bg-background px-3 py-2.5">Nationwide support</div>
            </div>
          </div>

          <div className="grid gap-px border border-border bg-border text-[12px]">
            <div className="flex items-start gap-3 bg-background p-4 text-secondary">
              <MapPin className="mt-0.5 h-4 w-4 text-accent" />
              <div>
                <p className="font-semibold text-foreground">Dar es Salaam Priority</p>
                <p className="mt-1">Fast local coordination with delivery planning across Tanzania.</p>
              </div>
            </div>
            <div className="flex items-start gap-3 bg-background p-4 text-secondary">
              <ShieldCheck className="mt-0.5 h-4 w-4 text-accent" />
              <div>
                <p className="font-semibold text-foreground">Verified Compatibility</p>
                <p className="mt-1">Build validation helps prevent mismatched parts before quote confirmation.</p>
              </div>
            </div>
            <div className="flex items-start gap-3 bg-background p-4 text-secondary">
              <Truck className="mt-0.5 h-4 w-4 text-accent" />
              <div>
                <p className="font-semibold text-foreground">Flexible Payments</p>
                <p className="mt-1">M-Pesa, bank transfer, or cash coordination through support team.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-2 gap-px bg-border md:grid-cols-5">
        {categories.map((category) => (
          <Link
            key={category.label}
            to={category.href}
            className="group flex min-h-[64px] items-center justify-center bg-surface px-4 py-3 text-center transition hover:text-foreground"
          >
            <span className="nav-13 text-secondary">{category.label}</span>
          </Link>
        ))}
      </section>

      <ProductRail title="New Arrivals" subtitle="Latest inventory updates" viewAllTo="/shop?sort=newest" />
      <ProductRail title="Gaming Desktops" subtitle="Performance-first towers" type="desktop" viewAllTo="/shop?type=desktop" />
      <ProductRail title="Gaming Laptops" subtitle="Portable power systems" type="laptop" viewAllTo="/shop?type=laptop" />

      <section className="grid gap-6 border-y border-border py-8 lg:grid-cols-[1fr_260px] lg:py-10">
        <div>
          <p className="label-11 text-secondary">Builder</p>
          <h2 className="section-title mt-3 text-foreground">Guided PC build with compatibility checks</h2>
          <p className="mt-3 max-w-2xl text-[13px] text-secondary">Choose parts, validate fit, and move to quote in a single, minimal flow.</p>
          <Link to="/builder" className="mt-5 inline-flex h-12 items-center bg-primary px-6 text-[13px] font-medium text-primaryForeground">
            Start Builder
          </Link>
        </div>
        <div className="space-y-2 text-[11px] uppercase tracking-[0.1em] text-muted">
          <p>Live Build Validation</p>
          <p>Quote-First Checkout</p>
          <p>Tanzania-Wide Support</p>
        </div>
      </section>

      <ProductRail title="Premium Parts" subtitle="Components for high-end rigs" type="component" viewAllTo="/shop?type=component" />

      <section className="grid gap-4 border-y border-border py-7 md:grid-cols-[1fr_auto] md:items-center">
        <div>
          <p className="label-11 text-secondary">Trust</p>
          <p className="mt-2 text-[13px] text-secondary">WhatsApp-assisted purchasing, verified compatibility, and delivery follow-up across Tanzania with cross-border support on request.</p>
        </div>
        <WhatsAppButton
          href="https://wa.me/255700000000"
          label="WhatsApp Consultation"
          className="inline-flex h-11 items-center gap-2 border border-border px-5 text-[13px] font-medium text-success"
        />
      </section>
    </div>
  );
}
