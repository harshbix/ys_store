import { Heart, LogIn, LogOut, ShoppingCart, Wrench, X } from 'lucide-react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useShowToast } from '../../hooks/useToast';
import { useAdminAuthStore, useAuthStore } from '../../store/auth';
import { useUiStore } from '../../store/ui';
import { ThemeToggle } from '../ui/ThemeToggle';
import { Sheet, SheetContent, SheetTitle } from '../ui/sheet';

const links = [
  { to: '/', label: 'Home' },
  { to: '/shop', label: 'Shop' },
  { to: '/shop?type=laptop', label: 'Gaming Laptops' },
  { to: '/shop?type=desktop', label: 'Gaming Desktops' },
  { to: '/shop?type=accessory', label: 'Accessories' },
  { to: '/builder', label: 'Custom PC Build' },
  { to: '/contact', label: 'Contact' }
];

export function MobileNav() {
  const navigate = useNavigate();
  const location = useLocation();
  const showToast = useShowToast();
  const isOpen = useUiStore((state) => state.mobileNavOpen);
  const close = useUiStore((state) => state.closeMobileNav);
  const customerAuthenticated = useAuthStore((state) => Boolean(state.accessToken && state.customerId));
  const adminAuthenticated = useAdminAuthStore((state) => Boolean(state.token));
  const { logout: customerLogout } = useAuthStore();
  const { clearSession: adminLogout } = useAdminAuthStore();

  const handleCartClick = () => {
    close();
    if (customerAuthenticated) {
      navigate('/cart');
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

  const handleLogout = () => {
    if (customerAuthenticated) {
      customerLogout();
    }
    if (adminAuthenticated) {
      adminLogout();
    }
    close();
    navigate('/');
    showToast({
      title: 'Signed out',
      description: 'You have been signed out successfully.',
      variant: 'default'
    });
  };

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && close()}>
      <SheetContent side="left" className="w-80 max-w-[85vw] p-0 flex flex-col pt-0 [&>button]:hidden overflow-y-auto border-r border-border bg-background">
        <SheetTitle className="sr-only">Mobile Navigation</SheetTitle>
        <div className="mb-5 flex h-14 items-center justify-between px-4 border-b border-border">
          <p className="text-[12px] font-semibold tracking-[0.2em] text-foreground">YS STORE</p>
          <button
            type="button"
            onClick={close}
            aria-label="Close menu"
            className="inline-flex h-9 w-9 items-center justify-center rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <nav aria-label="Mobile Main Navigation" className="space-y-1 px-4">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              onClick={close}
              className={({ isActive }) =>
                `flex min-h-10 items-center px-2 text-[13px] rounded-md transition-colors ${isActive ? 'bg-accent text-accent-foreground font-medium' : 'text-secondary hover:bg-accent/50 hover:text-foreground'}`
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>

        <div className="mt-6 space-y-1 border-t border-border pt-4 px-4 pb-4 flex-1">
          <div className="px-2 py-2 mb-2">
            <ThemeToggle />
          </div>

          <Link to="/wishlist" onClick={close} className="flex min-h-10 items-center gap-2 px-2 text-[13px] text-secondary hover:bg-accent/50 rounded-md hover:text-foreground transition-colors">
            <Heart className="h-4 w-4" />
            Wishlist
          </Link>
          <button type="button" onClick={handleCartClick} className="flex min-h-10 w-full items-center gap-2 px-2 text-[13px] text-secondary hover:bg-accent/50 rounded-md hover:text-foreground transition-colors">
            <ShoppingCart className="h-4 w-4" />
            Cart
          </button>
          <Link to="/builder" onClick={close} className="flex min-h-10 items-center gap-2 px-2 text-[13px] text-secondary hover:bg-accent/50 rounded-md hover:text-foreground transition-colors">
            <Wrench className="h-4 w-4" />
            Build Your PC
          </Link>
          <Link to="/login" onClick={close} className="flex min-h-10 items-center gap-2 px-2 text-[13px] text-secondary hover:bg-accent/50 rounded-md hover:text-foreground transition-colors">
            <LogIn className="h-4 w-4" />
            {customerAuthenticated ? 'Account' : 'Login'}
          </Link>
          {adminAuthenticated ? (
            <Link to="/admin" onClick={close} className="flex min-h-10 items-center gap-2 px-2 text-[13px] text-secondary hover:bg-accent/50 rounded-md hover:text-foreground transition-colors">
              Admin Dashboard
            </Link>
          ) : null}
          {(customerAuthenticated || adminAuthenticated) ? (
            <button
              type="button"
              onClick={handleLogout}
              className="flex min-h-10 w-full items-center gap-2 px-2 text-[13px] text-secondary hover:bg-accent/50 rounded-md hover:text-foreground transition-colors"
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </button>
          ) : null}
        </div>
      </SheetContent>
    </Sheet>
  );
}
