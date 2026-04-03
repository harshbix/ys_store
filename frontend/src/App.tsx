import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Layout } from './components/layout/Layout';
import { Home } from './pages/Home';
import { Shop } from './pages/Shop';
import { ProductDetail } from './pages/ProductDetail';
import { Builder } from './pages/Builder';
import { Cart } from './pages/Cart';
import { QuoteHandoff } from './pages/QuoteHandoff';
import { NotFound } from './pages/NotFound';

const queryClient = new QueryClient();

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="shop" element={<Shop />} />
            {/* Using :id based on our API design */}
            <Route path="products/:id" element={<ProductDetail />} />
            <Route path="builder" element={<Builder />} />
            <Route path="cart" element={<Cart />} />
            <Route path="checkout" element={<QuoteHandoff />} />
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}