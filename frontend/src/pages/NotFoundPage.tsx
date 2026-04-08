import { SEO } from '../components/seo/SEO';
import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <>
      <SEO title="Page Not Found" description="The page you requested does not exist or has moved." noindex={true} />
      <section className="flex min-h-[55vh] flex-col items-center justify-center rounded-2xl border border-border bg-surface p-8 text-center">
        <p className="text-xs uppercase tracking-[0.2em] text-muted">404</p>
        <h1 className="mt-2 font-display text-3xl font-semibold text-foreground">Page Not Found</h1>
        <p className="mt-2 text-sm text-muted">The page you requested does not exist or has moved.</p>
        <Link to="/" className="mt-5 inline-flex min-h-11 items-center rounded-full bg-primary px-5 text-sm font-semibold text-primaryForeground">
          Return Home
        </Link>
      </section>
    </>
  );
}
