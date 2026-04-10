import { Heart, Menu, Search, ShoppingBag, UserCircle2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useCart } from '../../hooks/useCart';
import { useShowToast } from '../../hooks/useToast';
import { useAdminAuthStore, useAuthStore, useIsAdmin } from '../../store/auth';
import { useUiStore } from '../../store/ui';
import { SearchResultsOverlay } from '../ui/SearchResultsOverlay';
import { Button } from '../ui/Button';
import { Badge } from '../ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '../ui/dropdown-menu';

const navLinks = [
  { label: 'Home', to: '/' },
  { label: 'Shop', to: '/shop' },
  { label: 'Gaming Laptops', to: '/shop?type=laptop' },
  { label: 'Gaming Desktops', to: '/shop?type=desktop' },
  { label: 'Accessories', to: '/shop?type=accessory' },
  { label: 'Custom PC Build', to: '/builder' },
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
  const customerEmail = useAuthStore((state) => state.email);
  const customerLogout = useAuthStore((state) => state.logout);
  const adminAuthenticated = useAdminAuthStore((state) => Boolean(state.token));
  const isAdmin = useIsAdmin();

  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    console.log("Current User Email:", customerEmail);
    console.log("Is Admin:", isAdmin);
    const handleScroll = () => setIsScrolled(window.scrollY > 4);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [customerEmail, isAdmin]);

  const cartItems = cartQuery.isSuccess ? (cartQuery.data?.items ?? []) : [];
  const cartCount = cartItems.length;
  const accountHref = (adminAuthenticated || isAdmin)
    ? '/admin' 
    : customerAuthenticated 
      ? '/shop' 
      : '/login';

  const handleCustomerLogout = async () => {
    try {
      const { supabase } = await import('../../lib/supabase');
      await supabase.auth.signOut();
    } catch {
      // Continue local logout even if remote signOut call fails.
    }

    customerLogout();
    showToast({ title: 'Signed out', variant: 'info' });
    navigate(isAdmin ? '/admin/login' : '/login', { replace: true });
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
    navigate(isAdmin ? '/admin/login' : '/login', {
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
          <Button
            variant="ghost"
            size="icon"
            onClick={openMobileNav} aria-expanded={mobileNavOpen} aria-controls="mobile-nav"
            className="text-secondary hover:text-foreground"
            aria-label="Open menu"
          >
            <Menu className="h-[18px] w-[18px]" />
          </Button>

          <Link to="/" aria-label="Home" className="absolute left-1/2 -translate-x-1/2 flex items-center justify-center">
            <span className="text-[12px] font-semibold tracking-[0.2em] text-foreground">
              YS STORE
            </span>
          </Link>

          <div className="ml-auto flex items-center">
            <Button
              variant="ghost"
              size="icon"
              onClick={openSearchOverlay} aria-expanded={searchOverlayOpen} aria-controls="search-overlay"
              className="text-secondary hover:text-foreground"
              aria-label="Open product search"
            >
              <Search className="h-[18px] w-[18px]" />
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={handleCartIntent} aria-expanded={cartDrawerOpen} aria-controls="cart-drawer"
              className="relative text-secondary hover:text-foreground"
              aria-label="Cart"
            >
              <ShoppingBag className="h-[18px] w-[18px]" />
              {cartCount > 0 ? (
                <Badge className="absolute min-w-4 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 font-mono text-[10px] font-medium text-primaryForeground hover:bg-accent -right-1 -top-1 border-0" aria-live="polite">
                  {cartCount}
                </Badge>
              ) : null}
            </Button>
          </div>
        </div>

        <div className="hidden h-full items-center gap-12 lg:flex">
          <Link to="/" aria-label="Home" className="shrink-0 flex items-center justify-center">
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

          <div className="ml-auto flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={openSearchOverlay} aria-expanded={searchOverlayOpen} aria-controls="search-overlay"
              className="text-secondary hover:text-foreground rounded-full"
              aria-label="Search"
            >
              <Search className="h-[18px] w-[18px]" />
            </Button>

            <Button variant="ghost" size="icon" asChild className="text-secondary hover:text-foreground rounded-full">
              <Link to="/wishlist" aria-label="Wishlist">
                <Heart className="h-[18px] w-[18px]" />
              </Link>
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={handleCartIntent} aria-expanded={cartDrawerOpen} aria-controls="cart-drawer"
              className="relative text-secondary hover:text-foreground rounded-full"
              aria-label="Open cart"
            >
              <ShoppingBag className="h-[18px] w-[18px]" />
              {cartCount > 0 ? (
                <Badge className="absolute min-w-4 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 font-mono text-[10px] font-medium text-primaryForeground hover:bg-accent -right-1 -top-1 border-0" aria-live="polite">
                  {cartCount}
                </Badge>
              ) : null}
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="text-secondary hover:text-foreground rounded-full">
                  <UserCircle2 className="h-[18px] w-[18px]" />
                  <span className="sr-only">{customerAuthenticated ? 'Account' : 'Login'}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem asChild>
                  <Link to={accountHref} className="cursor-pointer w-full">
                    {adminAuthenticated || isAdmin ? 'Admin Dashboard' : customerAuthenticated ? 'My Account' : 'Sign in'}
                  </Link>
                </DropdownMenuItem>
                {customerAuthenticated && !adminAuthenticated && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleCustomerLogout} className="cursor-pointer text-destructive focus:bg-destructive/10 focus:text-destructive">
                      Sign out
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      <SearchResultsOverlay open={searchOverlayOpen} onClose={closeSearchOverlay} />
    </header>
  );
}
