import { lazy, Suspense, useEffect, type ReactNode } from 'react';
import { createBrowserRouter, Navigate, Outlet, useLocation, useRouteError } from 'react-router-dom';
import { CartDrawer } from '../components/cart/CartDrawer';
import { ErrorState } from '../components/feedback/ErrorState';
import { PageLoader } from '../components/feedback/PageLoader';
import { Layout } from '../components/layout/Layout';
import { useAdmin } from '../hooks/useAdmin';
import { useAdminAuthStore, useAuthStore } from '../store/auth';

const HomePage = lazy(() => import('../pages/HomePage'));
const ShopPage = lazy(() => import('../pages/ShopPage'));
const ProductDetailPage = lazy(() => import('../pages/ProductDetailPage'));
const BuilderPage = lazy(() => import('../pages/BuilderPage'));
const CartPage = lazy(() => import('../pages/CartPage'));
const CheckoutPage = lazy(() => import('../pages/CheckoutPage'));
const WishlistPage = lazy(() => import('../pages/WishlistPage'));
const LoginPage = lazy(() => import('../pages/LoginPage'));
const RegisterPage = lazy(() => import('../pages/RegisterPage'));
const AuthCallbackPage = lazy(() => import('../pages/AuthCallbackPage'));
const BlogPage = lazy(() => import('../pages/BlogPage'));
const ContactPage = lazy(() => import('../pages/ContactPage'));
const AdminLoginPage = lazy(() => import('../pages/AdminLoginPage'));
const AdminDashboardPage = lazy(() => import('../pages/AdminDashboardPage'));
const NotFoundPage = lazy(() => import('../pages/NotFoundPage'));

const ADMIN_EMAILS = import.meta.env.VITE_ADMIN_EMAILS?.split(',').map((e: string) => e.trim().toLowerCase()) || [];

function PageBoundary({ children }: { children: ReactNode }) {
  return <Suspense fallback={<PageLoader />}>{children}</Suspense>;
}

function RequireAdmin({ children }: { children: ReactNode }) {
  const customerEmail = useAuthStore((state) => state.email);
  const location = useLocation();

  if (customerEmail && !ADMIN_EMAILS.includes(customerEmail.toLowerCase())) {
    return <Navigate to="/" replace />;
  }

  const { isAuthenticated, meQuery } = useAdmin();

  if (meQuery.isLoading) {
    return <PageLoader />;
  }

  if (!isAuthenticated || meQuery.isError || !meQuery.data?.admin) {
    return <Navigate to="/admin/login" replace state={{ from: location.pathname }} />;
  }

  return <>{children}</>;
}

function RequireCustomer({ children }: { children: ReactNode }) {
  const authBootstrapReady = useAuthStore((state) => state.authBootstrapReady);
  const isAuthenticated = useAuthStore((state) => Boolean(state.accessToken && state.customerId));
  const location = useLocation();

  if (!authBootstrapReady) {
    return <PageLoader />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname, returnTo: location.pathname }} />;
  }

  return <>{children}</>;
}

function RootLayout() {
  const location = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }, [location.pathname, location.search]);

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
      {
        path: 'cart',
        element: (
          <RequireCustomer>
            <PageBoundary><CartPage /></PageBoundary>
          </RequireCustomer>
        )
      },
      {
        path: 'checkout',
        element: (
          <RequireCustomer>
            <PageBoundary><CheckoutPage /></PageBoundary>
          </RequireCustomer>
        )
      },
      {
        path: 'wishlist',
        element: (
          <RequireCustomer>
            <PageBoundary><WishlistPage /></PageBoundary>
          </RequireCustomer>
        )
      },
      { path: 'login', element: <PageBoundary><LoginPage /></PageBoundary> },
      { path: 'register', element: <PageBoundary><RegisterPage /></PageBoundary> },
      { path: 'auth/callback', element: <PageBoundary><AuthCallbackPage /></PageBoundary> },
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
