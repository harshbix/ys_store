import { AnimatePresence, motion } from 'framer-motion';
import { Heart, LogIn, ShoppingCart, Wrench, X } from 'lucide-react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useShowToast } from '../../hooks/useToast';
import { useAdminAuthStore, useAuthStore } from '../../store/auth';
import { useUiStore } from '../../store/ui';
import { ThemeToggle } from '../ui/ThemeToggle';

const links = [
  { to: '/', label: 'Home' },
  { to: '/shop', label: 'Shop' },
  { to: '/shop?type=laptop', label: 'Gaming Laptops' },
  { to: '/shop?type=desktop', label: 'Gaming Desktops' },
  { to: '/shop?type=accessory', label: 'Accessories' },
  { to: '/builder', label: 'Custom PC Build' },
  { to: '/blog', label: 'Blog' },
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

  return (
    <AnimatePresence>
      {isOpen ? (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={close}
            className="fixed inset-0 z-40 bg-overlay/70"
          />
          <motion.aside
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ duration: 0.25 }}
            className="fixed inset-y-0 left-0 z-50 w-80 max-w-[85vw] overflow-y-auto border-r border-border bg-background px-4 py-3"
          >
            <div className="mb-5 flex h-10 items-center justify-between">
              <p className="text-[12px] font-light tracking-[0.2em]">YS STORE</p>
              <button
                type="button"
                onClick={close}
                aria-label="Close menu"
                className="inline-flex h-9 w-9 items-center justify-center text-secondary"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <nav className="space-y-1">
              {links.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  onClick={close}
                  className={({ isActive }) =>
                    `flex min-h-10 items-center px-1 text-[13px] ${isActive ? 'text-foreground' : 'text-secondary'}`
                  }
                >
                  {link.label}
                </NavLink>
              ))}
            </nav>

            <div className="mt-6 space-y-1 border-t border-border pt-4">
              <div className="px-1 py-2">
                <ThemeToggle />
              </div>

              <Link to="/wishlist" onClick={close} className="flex min-h-10 items-center gap-2 px-1 text-[13px] text-secondary">
                <Heart className="h-4 w-4" />
                Wishlist
              </Link>
              <button type="button" onClick={handleCartClick} className="flex min-h-10 w-full items-center gap-2 px-1 text-[13px] text-secondary">
                <ShoppingCart className="h-4 w-4" />
                Cart
              </button>
              <Link to="/builder" onClick={close} className="flex min-h-10 items-center gap-2 px-1 text-[13px] text-secondary">
                <Wrench className="h-4 w-4" />
                Build Your PC
              </Link>
              <Link to="/login" onClick={close} className="flex min-h-10 items-center gap-2 px-1 text-[13px] text-secondary">
                <LogIn className="h-4 w-4" />
                {customerAuthenticated ? 'Account' : 'Login'}
              </Link>
              {adminAuthenticated ? (
                <Link to="/admin" onClick={close} className="flex min-h-10 items-center gap-2 px-1 text-[13px] text-secondary">
                  Admin Dashboard
                </Link>
              ) : null}
            </div>
          </motion.aside>
        </>
      ) : null}
    </AnimatePresence>
  );
}
