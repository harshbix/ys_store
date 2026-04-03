import { Outlet, Link } from 'react-router-dom';
import { ShoppingBag, MonitorPlay } from 'lucide-react';
import { useCart } from '../../api/hooks';

export const Layout = () => {
  const { data: cart } = useCart();

  const cartCount = cart?.items?.reduce((acc, item) => acc + item.quantity, 0) || 0;

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans">
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/" className="text-xl font-bold tracking-tight uppercase">YS.STORE</Link>
          <nav className="flex items-center gap-6">
            <Link to="/shop" className="text-sm font-medium hover:text-primary transition-colors">SHOP</Link>
            <Link to="/builder" className="text-sm font-medium hover:text-primary transition-colors flex items-center gap-2">
              <MonitorPlay className="w-4 h-4"/> BUILDER
            </Link>
            <div className="w-px h-4 bg-border mx-2" />
            <Link to="/cart" className="hover:text-primary transition-colors relative flex items-center gap-2">
              <ShoppingBag className="w-5 h-5" />
              {cartCount > 0 && <span className="text-xs bg-white text-black px-1.5 py-0.5 rounded-full font-bold">{cartCount}</span>}
            </Link>
          </nav>
        </div>
      </header>
      <main className="flex-1 w-full max-w-7xl mx-auto px-6 py-8">
        <Outlet />
      </main>
    </div>
  );
};