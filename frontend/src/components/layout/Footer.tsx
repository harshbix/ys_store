import { Link } from 'react-router-dom';

export function Footer() {
  return (
    <footer className="mt-16 border-t border-border bg-surface">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:grid-cols-2 sm:px-6 lg:grid-cols-4 lg:px-8">
        <section>
          <h2 className="font-display text-xl font-semibold text-foreground">YS STORE</h2>
          <p className="mt-3 text-sm leading-6 text-muted">
            Premium desktops, laptops, and custom builds with trusted support and practical recommendations.
          </p>
          <p className="mt-4 text-sm text-foreground">Dar es Salaam, Tanzania</p>
        </section>

        <section>
          <h3 className="text-sm font-semibold uppercase tracking-wide text-foreground">Shop</h3>
          <ul className="mt-3 space-y-2 text-sm text-muted">
            <li><Link to="/shop?type=desktop" className="hover:text-foreground">Desktops</Link></li>
            <li><Link to="/shop?type=laptop" className="hover:text-foreground">Laptops</Link></li>
            <li><Link to="/shop?type=component" className="hover:text-foreground">Parts</Link></li>
            <li><Link to="/shop?type=accessory" className="hover:text-foreground">Accessories</Link></li>
          </ul>
        </section>

        <section>
          <h3 className="text-sm font-semibold uppercase tracking-wide text-foreground">Build & Support</h3>
          <ul className="mt-3 space-y-2 text-sm text-muted">
            <li><Link to="/builder" className="hover:text-foreground">PC Builder</Link></li>
            <li><Link to="/checkout" className="hover:text-foreground">Quote Checkout</Link></li>
            <li><Link to="/wishlist" className="hover:text-foreground">Wishlist</Link></li>
            <li><Link to="/cart" className="hover:text-foreground">Cart</Link></li>
          </ul>
        </section>

        <section>
          <h3 className="text-sm font-semibold uppercase tracking-wide text-foreground">Consult</h3>
          <p className="mt-3 text-sm text-muted">Need help with compatibility or budget balancing? Our team responds quickly on WhatsApp.</p>
          <a
            href="https://wa.me/255700000000"
            target="_blank"
            rel="noreferrer"
            className="mt-4 inline-flex min-h-11 items-center rounded-full border border-border px-4 text-sm font-semibold text-foreground transition hover:border-accent hover:text-accent"
          >
            Start WhatsApp Consultation
          </a>
        </section>
      </div>

      <div className="border-t border-border">
        <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-2 px-4 py-4 text-xs text-muted sm:flex-row sm:px-6 lg:px-8">
          <p>© {new Date().getFullYear()} YS STORE. All rights reserved.</p>
          <p>Premium hardware sourcing, verified compatibility, and trusted after-sales guidance.</p>
        </div>
      </div>
    </footer>
  );
}
