import { Heart, Search, ShoppingBag, Store, Wrench } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { useCart } from '../../hooks/useCart';
import { useUiStore } from '../../store/ui';

export function MobileBottomNav() {
  const openSearchOverlay = useUiStore((state) => state.openSearchOverlay);
  const cartQuery = useCart().cartQuery;
  const itemCount = cartQuery.isSuccess ? (cartQuery.data?.items ?? []).length : 0;

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-surface md:hidden" aria-label="Mobile bottom navigation">
      <div className="grid grid-cols-5">
        <NavLink to="/shop" className={({ isActive }) => `flex min-h-[52px] flex-col items-center justify-center gap-1 ${isActive ? 'text-foreground' : 'text-secondary'}`}>
          <Store className="h-4 w-4" />
          <span className="label-11 text-[10px] normal-case tracking-[0.02em]">Shop</span>
        </NavLink>

        <NavLink to="/builder" className={({ isActive }) => `flex min-h-[52px] flex-col items-center justify-center gap-1 ${isActive ? 'text-foreground' : 'text-secondary'}`}>
          <Wrench className="h-4 w-4" />
          <span className="label-11 text-[10px] normal-case tracking-[0.02em]">Builder</span>
        </NavLink>

        <button type="button" onClick={openSearchOverlay} className="flex min-h-[52px] flex-col items-center justify-center gap-1 text-secondary">
          <Search className="h-4 w-4" />
          <span className="label-11 text-[10px] normal-case tracking-[0.02em]">Search</span>
        </button>

        <NavLink to="/wishlist" className={({ isActive }) => `flex min-h-[52px] flex-col items-center justify-center gap-1 ${isActive ? 'text-foreground' : 'text-secondary'}`}>
          <Heart className="h-4 w-4" />
          <span className="label-11 text-[10px] normal-case tracking-[0.02em]">Wishlist</span>
        </NavLink>

        <NavLink to="/cart" className={({ isActive }) => `relative flex min-h-[52px] flex-col items-center justify-center gap-1 ${isActive ? 'text-foreground' : 'text-secondary'}`}>
          <ShoppingBag className="h-4 w-4" />
          <span className="label-11 text-[10px] normal-case tracking-[0.02em]">Cart</span>
          {itemCount > 0 ? (
            <span className="absolute right-3 top-2 inline-flex min-h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 font-mono text-[10px] font-medium text-primaryForeground">
              {itemCount}
            </span>
          ) : null}
        </NavLink>
      </div>
    </nav>
  );
}
