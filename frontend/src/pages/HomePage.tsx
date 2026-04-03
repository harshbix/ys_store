import { Link } from 'react-router-dom';
import { MessageCircle } from 'lucide-react';
import { ProductRail } from '../components/ui/ProductRail';

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
          <p>Dar es Salaam Support</p>
        </div>
      </section>

      <ProductRail title="Premium Parts" subtitle="Components for high-end rigs" type="component" viewAllTo="/shop?type=component" />

      <section className="grid gap-4 border-y border-border py-7 md:grid-cols-[1fr_auto] md:items-center">
        <div>
          <p className="label-11 text-secondary">Trust</p>
          <p className="mt-2 text-[13px] text-secondary">WhatsApp-assisted purchasing, verified compatibility, and local follow-up in Dar es Salaam.</p>
        </div>
        <a
          href="https://wa.me/255700000000"
          target="_blank"
          rel="noreferrer"
          className="inline-flex h-11 items-center gap-2 border border-border px-5 text-[13px] font-medium text-success"
        >
          <MessageCircle className="h-4 w-4" />
          WhatsApp Consultation
        </a>
      </section>
    </div>
  );
}
