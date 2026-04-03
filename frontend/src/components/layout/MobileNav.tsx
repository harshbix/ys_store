import { AnimatePresence, motion } from 'framer-motion';
import { Heart, LogIn, ShoppingCart, Wrench, X } from 'lucide-react';
import { Link, NavLink } from 'react-router-dom';
import { useAdminAuthStore, useAuthStore } from '../../store/auth';
import { useUiStore } from '../../store/ui';

const links = [
  { to: '/shop', label: 'Shop' },
  { to: '/shop?type=desktop', label: 'Desktops' },
  { to: '/shop?type=laptop', label: 'Laptops' },
  { to: '/shop?type=component', label: 'Parts' },
  { to: '/builder', label: 'Builder' }
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
            className="fixed inset-0 z-40 bg-black/70"
          />
          <motion.aside
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', bounce: 0.05, duration: 0.35 }}
            className="fixed inset-y-0 left-0 z-50 w-80 max-w-[85vw] overflow-y-auto border-r border-border bg-background p-4"
          >
            <div className="mb-6 flex items-center justify-between">
              <p className="font-display text-lg font-semibold tracking-wide">YS STORE</p>
              <button
                type="button"
                onClick={close}
                aria-label="Close menu"
                className="rounded-md border border-border p-2"
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
                    `flex min-h-11 items-center rounded-lg px-3 text-sm ${isActive ? 'bg-surfaceElevated text-foreground' : 'text-muted'}`
                  }
                >
                  {link.label}
                </NavLink>
              ))}
            </nav>

            <div className="mt-8 space-y-2 border-t border-border pt-4">
              <Link to="/wishlist" onClick={close} className="flex min-h-11 items-center gap-2 rounded-lg px-3 text-sm text-muted">
                <Heart className="h-4 w-4" />
                Wishlist
              </Link>
              <Link to="/cart" onClick={close} className="flex min-h-11 items-center gap-2 rounded-lg px-3 text-sm text-muted">
                <ShoppingCart className="h-4 w-4" />
                Cart
              </Link>
              <Link to="/builder" onClick={close} className="flex min-h-11 items-center gap-2 rounded-lg px-3 text-sm text-muted">
                <Wrench className="h-4 w-4" />
                Build Your PC
              </Link>
              <Link to="/login" onClick={close} className="flex min-h-11 items-center gap-2 rounded-lg px-3 text-sm text-muted">
                <LogIn className="h-4 w-4" />
                {customerAuthenticated ? 'Account' : 'Login'}
              </Link>
              {adminAuthenticated ? (
                <Link to="/admin" onClick={close} className="flex min-h-11 items-center gap-2 rounded-lg px-3 text-sm text-muted">
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
