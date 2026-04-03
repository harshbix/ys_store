import { lazy, Suspense } from 'react';
import { createBrowserRouter, Outlet } from 'react-router-dom';
import { CartDrawer } from '../components/cart/CartDrawer';
import { PageLoader } from '../components/feedback/PageLoader';
import { Layout } from '../components/layout/Layout';

const HomePage = lazy(() => import('../pages/HomePage'));
const ShopPage = lazy(() => import('../pages/ShopPage'));
const ProductDetailPage = lazy(() => import('../pages/ProductDetailPage'));
const BuilderPage = lazy(() => import('../pages/BuilderPage'));
const CartPage = lazy(() => import('../pages/CartPage'));
const CheckoutPage = lazy(() => import('../pages/CheckoutPage'));
const WishlistPage = lazy(() => import('../pages/WishlistPage'));
const NotFoundPage = lazy(() => import('../pages/NotFoundPage'));

function PageBoundary({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<PageLoader />}>{children}</Suspense>;
}

function RootLayout() {
  return (
    <Layout>
      <Outlet />
      <CartDrawer />
    </Layout>
  );
}

export const router = createBrowserRouter([
  {
    path: '/',
    element: <RootLayout />,
    children: [
      { index: true, element: <PageBoundary><HomePage /></PageBoundary> },
      { path: 'shop', element: <PageBoundary><ShopPage /></PageBoundary> },
      { path: 'products/:slug', element: <PageBoundary><ProductDetailPage /></PageBoundary> },
      { path: 'builder', element: <PageBoundary><BuilderPage /></PageBoundary> },
      { path: 'cart', element: <PageBoundary><CartPage /></PageBoundary> },
      { path: 'checkout', element: <PageBoundary><CheckoutPage /></PageBoundary> },
      { path: 'wishlist', element: <PageBoundary><WishlistPage /></PageBoundary> },
      { path: '*', element: <PageBoundary><NotFoundPage /></PageBoundary> }
    ]
  }
]);
