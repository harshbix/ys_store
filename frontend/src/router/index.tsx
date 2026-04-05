import { lazy, Suspense, type ReactNode } from 'react';
import { createBrowserRouter, Navigate, Outlet, useLocation, useRouteError } from 'react-router-dom';
import { CartDrawer } from '../components/cart/CartDrawer';
import { ErrorState } from '../components/feedback/ErrorState';
import { PageLoader } from '../components/feedback/PageLoader';
import { Layout } from '../components/layout/Layout';
import { useAdminAuthStore } from '../store/auth';

const HomePage = lazy(() => import('../pages/HomePage'));
const ShopPage = lazy(() => import('../pages/ShopPage'));
const ProductDetailPage = lazy(() => import('../pages/ProductDetailPage'));
const BuilderPage = lazy(() => import('../pages/BuilderPage'));
const CartPage = lazy(() => import('../pages/CartPage'));
const CheckoutPage = lazy(() => import('../pages/CheckoutPage'));
const WishlistPage = lazy(() => import('../pages/WishlistPage'));
const LoginPage = lazy(() => import('../pages/LoginPage'));
const RegisterPage = lazy(() => import('../pages/RegisterPage'));
const BlogPage = lazy(() => import('../pages/BlogPage'));
const ContactPage = lazy(() => import('../pages/ContactPage'));
const AdminLoginPage = lazy(() => import('../pages/AdminLoginPage'));
const AdminDashboardPage = lazy(() => import('../pages/AdminDashboardPage'));
const NotFoundPage = lazy(() => import('../pages/NotFoundPage'));

function PageBoundary({ children }: { children: ReactNode }) {
  return <Suspense fallback={<PageLoader />}>{children}</Suspense>;
}

function RequireAdmin({ children }: { children: ReactNode }) {
  const token = useAdminAuthStore((state) => state.token);
  const location = useLocation();

  if (!token) {
    return <Navigate to="/admin/login" replace state={{ from: location.pathname }} />;
  }

  return <>{children}</>;
}

function RootLayout() {
  return (
    <Layout>
      <Outlet />
      <CartDrawer />
    </Layout>
  );
}

function RootRouteError() {
  const error = useRouteError();
  console.error('[ROUTE ERROR]', error);

  return (
    <Layout>
      <ErrorState
        title="Page unavailable"
        description="This page failed to load, but the app shell is still running."
        onRetry={() => window.location.reload()}
      />
    </Layout>
  );
}

export const router = createBrowserRouter([
  {
    path: '/',
    element: <RootLayout />,
    errorElement: <RootRouteError />,
    children: [
      { index: true, element: <PageBoundary><HomePage /></PageBoundary> },
      { path: 'shop', element: <PageBoundary><ShopPage /></PageBoundary> },
      { path: 'products/:slug', element: <PageBoundary><ProductDetailPage /></PageBoundary> },
      { path: 'builder', element: <PageBoundary><BuilderPage /></PageBoundary> },
      { path: 'cart', element: <PageBoundary><CartPage /></PageBoundary> },
      { path: 'checkout', element: <PageBoundary><CheckoutPage /></PageBoundary> },
      { path: 'wishlist', element: <PageBoundary><WishlistPage /></PageBoundary> },
      { path: 'login', element: <PageBoundary><LoginPage /></PageBoundary> },
      { path: 'register', element: <PageBoundary><RegisterPage /></PageBoundary> },
      { path: 'blog', element: <PageBoundary><BlogPage /></PageBoundary> },
      { path: 'contact', element: <PageBoundary><ContactPage /></PageBoundary> },
      { path: 'admin/login', element: <PageBoundary><AdminLoginPage /></PageBoundary> },
      {
        path: 'admin',
        element: (
          <RequireAdmin>
            <PageBoundary><AdminDashboardPage /></PageBoundary>
          </RequireAdmin>
        )
      },
      { path: '*', element: <PageBoundary><NotFoundPage /></PageBoundary> }
    ]
  }
]);
