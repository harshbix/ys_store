import { Link } from 'react-router-dom';
import { ErrorState } from '../components/feedback/ErrorState';
import { useAdmin } from '../hooks/useAdmin';
import { formatTzs } from '../lib/currency';

export default function AdminDashboardPage() {
  const { admin, productsQuery, quotesQuery, logout } = useAdmin();

  const products = productsQuery.data?.data || [];
  const quotes = quotesQuery.data?.data || [];

  return (
    <div className="space-y-5 pb-8">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="section-title text-foreground">Admin Dashboard</h1>
          <p className="mt-2 text-[13px] text-secondary">Signed in as {admin?.full_name || admin?.email || 'Administrator'}.</p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to="/shop"
            className="inline-flex min-h-11 items-center rounded-full border border-border px-5 text-sm font-semibold text-foreground"
          >
            View Storefront
          </Link>
          <button
            type="button"
            onClick={() => void logout()}
            className="inline-flex min-h-11 items-center rounded-full bg-primary px-5 text-sm font-semibold text-primaryForeground"
          >
            Sign Out
          </button>
        </div>
      </header>

      {productsQuery.isError ? <ErrorState title="Products unavailable" description="Could not load admin products list." /> : null}
      {quotesQuery.isError ? <ErrorState title="Quotes unavailable" description="Could not load admin quotes list." /> : null}

      <section className="rounded-2xl border border-border bg-surface p-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-base font-semibold text-foreground">Products ({products.length})</h2>
          {productsQuery.isLoading ? <p className="text-xs text-muted">Loading...</p> : null}
        </div>

        {productsQuery.isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={`admin-products-skeleton-${index}`} className="h-10 animate-pulse rounded-lg border border-border bg-background" />
            ))}
          </div>
        ) : null}

        {products.length === 0 && !productsQuery.isLoading ? (
          <p className="text-sm text-muted">No products returned by admin endpoint.</p>
        ) : null}

        {products.length > 0 ? (
          <div className="overflow-hidden rounded-xl border border-border">
            <table className="min-w-full divide-y divide-border text-sm">
              <thead className="bg-background">
                <tr className="text-left text-xs uppercase tracking-wide text-muted">
                  <th className="px-3 py-2">Title</th>
                  <th className="px-3 py-2">Type</th>
                  <th className="px-3 py-2">Stock</th>
                  <th className="px-3 py-2">Price</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {products.slice(0, 12).map((product) => (
                  <tr key={product.id}>
                    <td className="px-3 py-2 text-foreground">{product.title}</td>
                    <td className="px-3 py-2 text-muted">{product.product_type}</td>
                    <td className="px-3 py-2 text-muted">{product.stock_status}</td>
                    <td className="px-3 py-2 text-foreground">{formatTzs(product.estimated_price_tzs)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </section>

      <section className="rounded-2xl border border-border bg-surface p-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-base font-semibold text-foreground">Quotes ({quotes.length})</h2>
          {quotesQuery.isLoading ? <p className="text-xs text-muted">Loading...</p> : null}
        </div>

        {quotesQuery.isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={`admin-quotes-skeleton-${index}`} className="h-10 animate-pulse rounded-lg border border-border bg-background" />
            ))}
          </div>
        ) : null}

        {quotes.length === 0 && !quotesQuery.isLoading ? (
          <p className="text-sm text-muted">No quotes returned by admin endpoint.</p>
        ) : null}

        {quotes.length > 0 ? (
          <div className="overflow-hidden rounded-xl border border-border">
            <table className="min-w-full divide-y divide-border text-sm">
              <thead className="bg-background">
                <tr className="text-left text-xs uppercase tracking-wide text-muted">
                  <th className="px-3 py-2">Quote Code</th>
                  <th className="px-3 py-2">Customer</th>
                  <th className="px-3 py-2">Status</th>
                  <th className="px-3 py-2">Estimated Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {quotes.slice(0, 12).map((quote) => (
                  <tr key={quote.id}>
                    <td className="px-3 py-2 text-foreground">{quote.quote_code}</td>
                    <td className="px-3 py-2 text-muted">{quote.customer_name}</td>
                    <td className="px-3 py-2 text-muted">{quote.status}</td>
                    <td className="px-3 py-2 text-foreground">{formatTzs(quote.estimated_total_tzs)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </section>
    </div>
  );
}
