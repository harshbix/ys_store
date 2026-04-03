import { Heart, LogIn, Menu, Search, ShoppingBag, UserCircle2, Wrench } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { useCart } from '../../hooks/useCart';
import { useAdminAuthStore, useAuthStore } from '../../store/auth';
import { useUiStore } from '../../store/ui';
import { SearchResultsOverlay } from '../ui/SearchResultsOverlay.tsx';

const navLinks = [
  { label: 'Shop', to: '/shop' },
  { label: 'Desktops', to: '/shop?type=desktop' },
  { label: 'Laptops', to: '/shop?type=laptop' },
  { label: 'Parts', to: '/shop?type=component' },
  { label: 'Builder', to: '/builder' }
];

export function Header() {
  const { cartQuery } = useCart();
  const openMobileNav = useUiStore((state) => state.openMobileNav);
  const searchOverlayOpen = useUiStore((state) => state.searchOverlayOpen);
  const openSearchOverlay = useUiStore((state) => state.openSearchOverlay);
  const closeSearchOverlay = useUiStore((state) => state.closeSearchOverlay);
  const customerAuthenticated = useAuthStore((state) => Boolean(state.accessToken && state.customerId));
  const adminAuthenticated = useAdminAuthStore((state) => Boolean(state.token));

  const [isCompact, setIsCompact] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsCompact(window.scrollY > 18);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const cartCount = cartQuery.data?.data.items.length || 0;

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/95 backdrop-blur">
      <div className={`mx-auto flex max-w-7xl items-center gap-2 px-4 transition-all sm:px-6 lg:px-8 ${isCompact ? 'h-14' : 'h-16'}`}>
        <button
          type="button"
          onClick={openMobileNav}
          className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-md border border-border lg:hidden"
          aria-label="Open menu"
        >
          <Menu className="h-4 w-4" />
        </button>

        <Link to="/" className="font-display text-lg font-semibold tracking-wide text-foreground">
          YS STORE
        </Link>

        <nav className="ml-8 hidden items-center gap-1 lg:flex">
          {navLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                `min-h-11 rounded-lg px-3 text-sm font-medium transition ${isActive ? 'text-foreground' : 'text-muted hover:text-foreground'}`
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-1">
          <button
            type="button"
            onClick={openSearchOverlay}
            className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-md border border-border"
            aria-label="Open product search"
          >
            <Search className="h-4 w-4" />
          </button>

          <Link
            to="/builder"
            className="hidden min-h-11 items-center gap-2 rounded-md border border-border px-3 text-sm text-muted transition hover:text-foreground sm:inline-flex"
          >
            <Wrench className="h-4 w-4" />
            Builder
          </Link>

          <Link
            to="/wishlist"
            className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-md border border-border"
            aria-label="Wishlist"
          >
            <Heart className="h-4 w-4" />
          </Link>

          <Link
            to="/cart"
            className="relative inline-flex min-h-11 min-w-11 items-center justify-center rounded-md border border-border"
            aria-label="Cart"
          >
            <ShoppingBag className="h-4 w-4" />
            <span className="absolute -right-1 -top-1 inline-flex min-h-5 min-w-5 items-center justify-center rounded-full bg-accent px-1 text-[10px] font-bold text-primaryForeground" aria-live="polite">
              {cartCount}
            </span>
          </Link>

          {adminAuthenticated ? (
            <Link
              to="/admin"
              className="hidden min-h-11 items-center rounded-md border border-border px-3 text-sm text-muted transition hover:text-foreground sm:inline-flex"
            >
              Admin
            </Link>
          ) : null}

          <Link
            to="/login"
            className="inline-flex min-h-11 items-center gap-2 rounded-md border border-border px-3 text-sm text-muted transition hover:text-foreground"
          >
            {customerAuthenticated ? <UserCircle2 className="h-4 w-4" /> : <LogIn className="h-4 w-4" />}
            <span className="hidden sm:inline">{customerAuthenticated ? 'Account' : 'Login'}</span>
          </Link>
        </div>
      </div>

      <SearchResultsOverlay open={searchOverlayOpen} onClose={closeSearchOverlay} />
    </header>
  );
}
