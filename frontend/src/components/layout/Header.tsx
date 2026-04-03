import { AnimatePresence, motion } from 'framer-motion';
import { Heart, LogIn, Menu, Search, ShoppingBag, UserCircle2, Wrench, X } from 'lucide-react';
import { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { useCart } from '../../hooks/useCart';
import { useSessionStore } from '../../store/session';
import { useUiStore } from '../../store/ui';
import { AuthPromptBanner } from '../ui/AuthPromptBanner';
import { SearchResultsOverlay } from '../ui/SearchResultsOverlay';

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
  const openAccountModal = useUiStore((state) => state.openAccountModal);
  const closeAccountModal = useUiStore((state) => state.closeAccountModal);
  const accountModalOpen = useUiStore((state) => state.accountModalOpen);
  const searchOverlayOpen = useUiStore((state) => state.searchOverlayOpen);
  const openSearchOverlay = useUiStore((state) => state.openSearchOverlay);
  const closeSearchOverlay = useUiStore((state) => state.closeSearchOverlay);
  const guestSessionId = useSessionStore((state) => state.guestSessionId);
  const markAccountPromptSeen = useSessionStore((state) => state.markAccountPromptSeen);

  const [isCompact, setIsCompact] = useState(false);

  useState(() => {
    const handleScroll = () => setIsCompact(window.scrollY > 18);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  });

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

          <button
            type="button"
            onClick={openAccountModal}
            className="inline-flex min-h-11 items-center gap-2 rounded-md border border-border px-3 text-sm text-muted transition hover:text-foreground"
          >
            <LogIn className="h-4 w-4" />
            <span className="hidden sm:inline">Account</span>
          </button>
        </div>
      </div>

      <AnimatePresence>
        {accountModalOpen ? (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/70"
              onClick={closeAccountModal}
            />
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              className="fixed inset-x-4 top-[15vh] z-50 mx-auto max-w-lg rounded-2xl border border-border bg-surface p-5"
              role="dialog"
              aria-modal="true"
              aria-label="Account and session information"
            >
              <div className="mb-4 flex items-start justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-foreground">Account / Login</h2>
                  <p className="text-sm text-muted">Guest-first shopping is active for speed and continuity.</p>
                </div>
                <button type="button" onClick={closeAccountModal} className="rounded-md border border-border p-2">
                  <X className="h-4 w-4" />
                </button>
              </div>

              <AuthPromptBanner />

              <div className="mt-4 rounded-xl border border-border bg-background p-3 text-xs text-muted">
                <p className="inline-flex items-center gap-2">
                  <UserCircle2 className="h-4 w-4" />
                  Session: {guestSessionId || 'initializing...'}
                </p>
              </div>

              <div className="mt-5 flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    markAccountPromptSeen();
                    closeAccountModal();
                  }}
                  className="min-h-11 rounded-full bg-primary px-5 text-sm font-semibold text-primaryForeground"
                >
                  Continue as Guest
                </button>
                <a
                  href="https://wa.me/255700000000"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex min-h-11 items-center rounded-full border border-border px-5 text-sm font-semibold text-foreground"
                >
                  Contact Support
                </a>
              </div>
            </motion.div>
          </>
        ) : null}
      </AnimatePresence>

      <SearchResultsOverlay open={searchOverlayOpen} onClose={closeSearchOverlay} />
    </header>
  );
}
