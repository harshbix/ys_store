import { Link } from 'react-router-dom';

export function Footer() {
  return (
    <footer className="border-t border-border bg-background">
      <div className="mx-auto grid w-full max-w-[1440px] gap-8 px-4 py-14 sm:grid-cols-2 sm:px-6 lg:grid-cols-4 lg:px-8">
        <section>
          <h2 className="label-11 text-secondary">Shop</h2>
          <ul className="mt-4 space-y-2 text-[13px] text-secondary">
            <li><Link to="/shop" className="transition hover:text-foreground">All Products</Link></li>
            <li><Link to="/shop?type=desktop" className="transition hover:text-foreground">Desktops</Link></li>
            <li><Link to="/shop?type=laptop" className="transition hover:text-foreground">Laptops</Link></li>
            <li><Link to="/shop?type=component" className="transition hover:text-foreground">Parts</Link></li>
            <li><Link to="/shop?featured_tag=hot_deal" className="transition hover:text-foreground">Sale</Link></li>
          </ul>
        </section>

        <section>
          <h3 className="label-11 text-secondary">Support</h3>
          <ul className="mt-4 space-y-2 text-[13px] text-secondary">
            <li><Link to="/builder" className="transition hover:text-foreground">Builder</Link></li>
            <li><Link to="/checkout" className="transition hover:text-foreground">Quote Checkout</Link></li>
            <li><Link to="/cart" className="transition hover:text-foreground">Cart</Link></li>
            <li><Link to="/wishlist" className="transition hover:text-foreground">Wishlist</Link></li>
          </ul>
        </section>

        <section>
          <h3 className="label-11 text-secondary">About</h3>
          <ul className="mt-4 space-y-2 text-[13px] text-secondary">
            <li><Link to="/shop" className="transition hover:text-foreground">Catalog</Link></li>
            <li><Link to="/login" className="transition hover:text-foreground">Account</Link></li>
            <li><Link to="/admin/login" className="transition hover:text-foreground">Admin Access</Link></li>
          </ul>
        </section>

        <section>
          <h3 className="label-11 text-secondary">Brand</h3>
          <p className="mt-4 text-[13px] leading-6 text-secondary">
            YS STORE curates premium PC hardware with quote-first support for Dar es Salaam buyers.
          </p>
          <a
            href="https://wa.me/255700000000"
            target="_blank"
            rel="noreferrer"
            className="mt-5 inline-flex min-h-11 items-center border border-border px-4 text-[13px] font-medium text-success transition hover:border-success"
          >
            WhatsApp Support
          </a>
        </section>
      </div>

      <div className="border-t border-border">
        <div className="mx-auto flex w-full max-w-[1440px] flex-col items-start justify-between gap-2 px-4 py-4 text-[11px] text-muted sm:flex-row sm:px-6 lg:px-8">
          <p>© {new Date().getFullYear()} YS STORE. All rights reserved.</p>
          <p>Dar es Salaam, Tanzania</p>
        </div>
      </div>
    </footer>
  );
}
