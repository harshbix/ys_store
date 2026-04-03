import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { MessageCircle, ShieldCheck, Sparkles, Wrench } from 'lucide-react';
import { ProductRail } from '../components/ui/ProductRail';

const categories = [
  { label: 'Desktops', href: '/shop?type=desktop', note: 'Ready for studio and gaming rigs' },
  { label: 'Laptops', href: '/shop?type=laptop', note: 'Portable performance for work and creators' },
  { label: 'Components', href: '/shop?type=component', note: 'Premium parts for custom upgrades' },
  { label: 'Accessories', href: '/shop?type=accessory', note: 'Monitors, peripherals, and essentials' }
];

export default function HomePage() {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-10 pb-8">
      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {categories.map((category) => (
          <Link
            key={category.label}
            to={category.href}
            className="group rounded-2xl border border-border bg-surface p-4 transition hover:-translate-y-0.5 hover:border-accent"
          >
            <p className="text-xs uppercase tracking-widest text-muted">Category</p>
            <h1 className="mt-2 font-display text-xl font-semibold text-foreground">{category.label}</h1>
            <p className="mt-2 text-sm text-muted">{category.note}</p>
          </Link>
        ))}
      </section>

      <ProductRail title="New Arrivals" subtitle="Fresh listings from the latest inventory updates" viewAllTo="/shop?sort=newest" />
      <ProductRail title="Featured Desktops" subtitle="Balanced systems for performance and reliability" type="desktop" viewAllTo="/shop?type=desktop" />
      <ProductRail title="Gaming Laptops" subtitle="Portable power without compromise" type="laptop" viewAllTo="/shop?type=laptop" />
      <ProductRail title="Premium Parts" subtitle="High-trust components for precision builds" type="component" viewAllTo="/shop?type=component" />
      <ProductRail title="Accessories" subtitle="Monitors, keyboards, and practical add-ons" type="accessory" viewAllTo="/shop?type=accessory" />

      <section className="grid gap-4 rounded-2xl border border-border bg-surface p-5 lg:grid-cols-2">
        <div>
          <p className="inline-flex items-center gap-2 text-xs uppercase tracking-wide text-accentSoft">
            <Wrench className="h-3.5 w-3.5" />
            Build Your PC
          </p>
          <h2 className="mt-2 font-display text-2xl font-semibold">Guided custom build flow with compatibility checks</h2>
          <p className="mt-2 text-sm text-muted">Select parts, validate fit, and send a quote-ready build to WhatsApp in minutes.</p>
          <Link to="/builder" className="mt-4 inline-flex min-h-11 items-center rounded-full bg-primary px-5 text-sm font-semibold text-primaryForeground">
            Start Builder
          </Link>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-border bg-background p-4">
            <ShieldCheck className="h-4 w-4 text-accent" />
            <p className="mt-2 text-sm font-semibold">Verified compatibility logic</p>
            <p className="mt-1 text-xs text-muted">Validation uses real backend rules, not static assumptions.</p>
          </div>
          <div className="rounded-xl border border-border bg-background p-4">
            <Sparkles className="h-4 w-4 text-accent" />
            <p className="mt-2 text-sm font-semibold">Premium support handoff</p>
            <p className="mt-1 text-xs text-muted">Quote flow transitions directly into guided WhatsApp support.</p>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-border bg-surface p-5">
        <h2 className="text-lg font-semibold text-foreground">Need quick guidance before buying?</h2>
        <p className="mt-2 text-sm text-muted">Our team helps with part matching, budget trade-offs, and upgrade planning for Dar es Salaam buyers.</p>
        <a
          href="https://wa.me/255700000000"
          target="_blank"
          rel="noreferrer"
          className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-full border border-border px-5 text-sm font-semibold text-foreground hover:border-accent hover:text-accent"
        >
          <MessageCircle className="h-4 w-4" />
          WhatsApp Consultation
        </a>
      </section>
    </motion.div>
  );
}
