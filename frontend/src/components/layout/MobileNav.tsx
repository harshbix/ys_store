import { AnimatePresence, motion } from 'framer-motion';
import { Heart, LogIn, ShoppingCart, Wrench, X } from 'lucide-react';
import { Link, NavLink } from 'react-router-dom';
import { useAdminAuthStore, useAuthStore } from '../../store/auth';
import { useUiStore } from '../../store/ui';
import { ThemeToggle } from '../ui/ThemeToggle';

const links = [
  { to: '/shop', label: 'Shop' },
  { to: '/shop?type=desktop', label: 'Desktops' },
  { to: '/shop?type=laptop', label: 'Laptops' },
  { to: '/shop?type=component', label: 'Parts' },
  { to: '/builder', label: 'Builder' },
  { to: '/shop?featured_tag=hot_deal', label: 'Sale' }
];

export function MobileNav() {
  const isOpen = useUiStore((state) => state.mobileNavOpen);
  const close = useUiStore((state) => state.closeMobileNav);
  const customerAuthenticated = useAuthStore((state) => Boolean(state.accessToken && state.customerId));
  const adminAuthenticated = useAdminAuthStore((state) => Boolean(state.token));

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
              <Link to="/cart" onClick={close} className="flex min-h-10 items-center gap-2 px-1 text-[13px] text-secondary">
                <ShoppingCart className="h-4 w-4" />
                Cart
              </Link>
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
