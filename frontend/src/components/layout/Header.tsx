import { Heart, Menu, Search, ShoppingBag, UserCircle2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { useCart } from '../../hooks/useCart';
import { useAdminAuthStore, useAuthStore } from '../../store/auth';
import { useUiStore } from '../../store/ui';
import { SearchResultsOverlay } from '../ui/SearchResultsOverlay.tsx';
import { ThemeToggle } from '../ui/ThemeToggle';

const navLinks = [
  { label: 'Shop', to: '/shop' },
  { label: 'Desktops', to: '/shop?type=desktop' },
  { label: 'Laptops', to: '/shop?type=laptop' },
  { label: 'Parts', to: '/shop?type=component' },
  { label: 'Builder', to: '/builder' },
  { label: 'Sale', to: '/shop?featured_tag=hot_deal' }
];

export function Header() {
  const { cartQuery } = useCart();
  const openMobileNav = useUiStore((state) => state.openMobileNav);
  const openCartDrawer = useUiStore((state) => state.openCartDrawer);
  const searchOverlayOpen = useUiStore((state) => state.searchOverlayOpen);
  const openSearchOverlay = useUiStore((state) => state.openSearchOverlay);
  const closeSearchOverlay = useUiStore((state) => state.closeSearchOverlay);
  const customerAuthenticated = useAuthStore((state) => Boolean(state.accessToken));
  const adminAuthenticated = useAdminAuthStore((state) => Boolean(state.token));

  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 4);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const cartCount = cartQuery.data?.data.items.length || 0;
  const accountHref = adminAuthenticated ? '/admin' : '/login';

  return (
    <header className={`sticky top-0 z-30 border-b transition ${isScrolled ? 'border-border bg-background/95 backdrop-blur' : 'border-transparent bg-background'}`}>
      <div className="mx-auto h-[52px] w-full max-w-[1440px] px-4 sm:px-6 lg:px-8">
        <div className="relative flex h-full items-center justify-between lg:hidden">
          <button
            type="button"
            onClick={openMobileNav}
            className="inline-flex h-9 w-9 items-center justify-center text-secondary"
            aria-label="Open menu"
          >
            <Menu className="h-4 w-4" />
          </button>

          <Link to="/" aria-label="Home" className="absolute left-1/2 -translate-x-1/2">
            <span className="block h-3 w-24" aria-hidden="true" />
          </Link>

          <div className="ml-auto flex items-center gap-1">
            <ThemeToggle compact />

            <button
              type="button"
              onClick={openSearchOverlay}
              className="inline-flex h-9 w-9 items-center justify-center text-secondary"
              aria-label="Open product search"
            >
              <Search className="h-4 w-4" />
            </button>

            <Link to="/cart" className="relative inline-flex h-9 w-9 items-center justify-center text-secondary" aria-label="Cart">
              <ShoppingBag className="h-4 w-4" />
              {cartCount > 0 ? (
                <span className="absolute right-0 top-0 inline-flex min-h-4 min-w-4 animate-pulse-soft items-center justify-center rounded-full bg-accent px-1 font-mono text-[10px] font-medium text-primaryForeground" aria-live="polite">
                  {cartCount}
                </span>
              ) : null}
            </Link>
          </div>
        </div>

        <div className="hidden h-full items-center lg:flex">
          <nav className="flex flex-1 items-center gap-5">
            {navLinks.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) =>
                  `nav-13 text-[13px] transition ${isActive ? 'text-foreground' : 'text-secondary hover:text-foreground'}`
                }
              >
                {link.label}
              </NavLink>
            ))}
          </nav>

          <Link to="/" aria-label="Home">
            <span className="block h-3 w-24" aria-hidden="true" />
          </Link>

          <div className="flex flex-1 items-center justify-end gap-1">
            <ThemeToggle compact />

            <button
              type="button"
              onClick={openSearchOverlay}
              className="inline-flex h-9 w-9 items-center justify-center text-secondary transition hover:text-foreground"
              aria-label="Search"
            >
              <Search className="h-4 w-4" />
            </button>

            <Link to="/wishlist" className="inline-flex h-9 w-9 items-center justify-center text-secondary transition hover:text-foreground" aria-label="Wishlist">
              <Heart className="h-4 w-4" />
            </Link>

            <button
              type="button"
              onClick={openCartDrawer}
              className="relative inline-flex h-9 w-9 items-center justify-center text-secondary transition hover:text-foreground"
              aria-label="Open cart"
            >
              <ShoppingBag className="h-4 w-4" />
              {cartCount > 0 ? (
                <span className="absolute right-0 top-0 inline-flex min-h-4 min-w-4 animate-pulse-soft items-center justify-center rounded-full bg-accent px-1 font-mono text-[10px] font-medium text-primaryForeground" aria-live="polite">
                  {cartCount}
                </span>
              ) : null}
            </button>

            <Link
              to={accountHref}
              className="inline-flex h-9 w-9 items-center justify-center text-secondary transition hover:text-foreground"
              aria-label={customerAuthenticated ? 'Account' : 'Login'}
            >
              <UserCircle2 className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>

      <SearchResultsOverlay open={searchOverlayOpen} onClose={closeSearchOverlay} />
    </header>
  );
}
