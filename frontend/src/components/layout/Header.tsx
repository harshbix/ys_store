import { Heart, Menu, Search, ShoppingBag, UserCircle2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useCart } from '../../hooks/useCart';
import { useShowToast } from '../../hooks/useToast';
import { useAdminAuthStore, useAuthStore } from '../../store/auth';
import { useUiStore } from '../../store/ui';
import { SearchResultsOverlay } from '../ui/SearchResultsOverlay.tsx';

const navLinks = [
  { label: 'Home', to: '/' },
  { label: 'Shop', to: '/shop' },
  { label: 'Gaming Laptops', to: '/shop?type=laptop' },
  { label: 'Gaming Desktops', to: '/shop?type=desktop' },
  { label: 'Accessories', to: '/shop?type=accessory' },
  { label: 'Custom PC Build', to: '/builder' },
  { label: 'Blog', to: '/blog' },
  { label: 'Contact', to: '/contact' }
];

export function Header() {
  const navigate = useNavigate();
  const location = useLocation();
  const showToast = useShowToast();
  const { cartQuery } = useCart();
  const openMobileNav = useUiStore((state) => state.openMobileNav);
  const mobileNavOpen = useUiStore((state) => state.mobileNavOpen);
  const openCartDrawer = useUiStore((state) => state.openCartDrawer);
  const cartDrawerOpen = useUiStore((state) => state.cartDrawerOpen);
  const searchOverlayOpen = useUiStore((state) => state.searchOverlayOpen);
  const openSearchOverlay = useUiStore((state) => state.openSearchOverlay);
  const closeSearchOverlay = useUiStore((state) => state.closeSearchOverlay);
  const customerAuthenticated = useAuthStore((state) => Boolean(state.accessToken));
  const customerLogout = useAuthStore((state) => state.logout);
  const adminAuthenticated = useAdminAuthStore((state) => Boolean(state.token));

  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 4);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const cartItems = cartQuery.isSuccess ? (cartQuery.data?.items ?? []) : [];
  const cartCount = cartItems.length;
  const accountHref = adminAuthenticated ? '/admin' : '/login';

  const handleCustomerLogout = async () => {
    try {
      const { supabase } = await import('../../lib/supabase');
      await supabase.auth.signOut();
    } catch {
      // Continue local logout even if remote signOut call fails.
    }

    customerLogout();
    showToast({ title: 'Signed out', variant: 'info' });
    navigate('/login', { replace: true });
  };

  const handleCartIntent = () => {
    if (customerAuthenticated) {
      openCartDrawer();
      return;
    }

    showToast({
      title: 'Please log in first',
      description: 'Sign in to open your cart.',
      variant: 'info'
    });
    navigate('/login', {
      state: {
        from: location.pathname,
        returnTo: '/cart'
      }
    });
  };

  return (
    <header className={`sticky top-0 z-30 transition ${isScrolled ? 'border-b border-border bg-background/95 backdrop-blur' : 'border-b border-border/30 bg-background'}`}>
      <div className="mx-auto h-14 w-full max-w-[1440px] px-4 sm:px-6 lg:px-8">
        <div className="relative flex h-full items-center justify-between lg:hidden">
          <button
            type="button"
            onClick={openMobileNav} aria-expanded={mobileNavOpen} aria-controls="mobile-nav"
            className="inline-flex h-9 w-9 items-center justify-center text-secondary"
            aria-label="Open menu"
          >
            <Menu className="h-[18px] w-[18px]" />
          </button>

          <Link to="/" aria-label="Home" className="absolute left-1/2 -translate-x-1/2">
            <span className="text-[12px] font-semibold tracking-[0.2em] text-foreground">
              YS STORE
            </span>
          </Link>

          <div className="ml-auto flex items-center gap-2">
            <button
              type="button"
              onClick={openSearchOverlay} aria-expanded={searchOverlayOpen} aria-controls="search-overlay"
              className="inline-flex h-9 w-9 items-center justify-center text-secondary"
              aria-label="Open product search"
            >
              <Search className="h-[18px] w-[18px]" />
            </button>

            <button
              type="button"
              onClick={handleCartIntent} aria-expanded={cartDrawerOpen} aria-controls="cart-drawer"
              className="relative inline-flex h-9 w-9 items-center justify-center text-secondary"
              aria-label="Cart"
            >
              <ShoppingBag className="h-[18px] w-[18px]" />
              {cartCount > 0 ? (
                <span className="absolute right-0 top-0 inline-flex min-h-4 min-w-4 animate-pulse-soft items-center justify-center rounded-full bg-accent px-1 font-mono text-[10px] font-medium text-primaryForeground" aria-live="polite">
                  {cartCount}
                </span>
              ) : null}
            </button>
          </div>
        </div>

        <div className="hidden h-full items-center gap-12 lg:flex">
          <Link to="/" aria-label="Home" className="shrink-0">
            <span className="text-[12px] font-semibold tracking-[0.2em] text-foreground">
              YS STORE
            </span>
          </Link>

          <nav aria-label="Main Navigation" className="flex items-center gap-6">
            {navLinks.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) =>
                  `text-[12px] font-medium tracking-[0.04em] transition ${isActive ? 'text-foreground' : 'text-secondary hover:text-foreground'}`
                }
              >
                {link.label}
              </NavLink>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-5">
            <button
              type="button"
              onClick={openSearchOverlay} aria-expanded={searchOverlayOpen} aria-controls="search-overlay"
              className="inline-flex h-9 w-9 items-center justify-center text-secondary transition hover:text-foreground"
              aria-label="Search"
            >
              <Search className="h-[18px] w-[18px]" />
            </button>

            <Link to="/wishlist" className="inline-flex h-9 w-9 items-center justify-center text-secondary transition hover:text-foreground" aria-label="Wishlist">
              <Heart className="h-[18px] w-[18px]" />
            </Link>

            <button
              type="button"
              onClick={handleCartIntent} aria-expanded={cartDrawerOpen} aria-controls="cart-drawer"
              className="relative inline-flex h-9 w-9 items-center justify-center text-secondary transition hover:text-foreground"
              aria-label="Open cart"
            >
              <ShoppingBag className="h-[18px] w-[18px]" />
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
              <UserCircle2 className="h-[18px] w-[18px]" />
            </Link>

            {customerAuthenticated && !adminAuthenticated ? (
              <button
                type="button"
                onClick={handleCustomerLogout}
                className="inline-flex min-h-9 items-center rounded-full border border-border px-3 text-[11px] font-semibold tracking-[0.08em] text-foreground transition hover:border-foreground"
                aria-label="Sign out"
              >
                Sign out
              </button>
            ) : null}
          </div>
        </div>
      </div>

      <SearchResultsOverlay open={searchOverlayOpen} onClose={closeSearchOverlay} />
    </header>
  );
}
