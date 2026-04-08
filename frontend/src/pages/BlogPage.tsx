import { SEO } from '../components/seo/SEO';
import { Link } from 'react-router-dom';

export default function BlogPage() {
  return (
    <>
      <SEO 
        title="YS Insights | Tech Blog" 
        description="Tech tips and buying guides from YS Store. Explore our latest thoughts on PC building and hardware."
      />
      <div className="mx-auto max-w-4xl space-y-5 pb-10">
      <header className="space-y-2">
        <p className="label-11 text-secondary">YS Insights</p>
        <h1 className="text-[32px] font-semibold tracking-[-0.03em] text-foreground">Tech tips and buying guides</h1>
        <p className="text-sm text-secondary">Editorial content is being prepared. In the meantime, explore live products and builds.</p>
      </header>

      <section className="rounded-2xl border border-border bg-surface p-5">
        <p className="text-sm text-secondary">No posts published yet.</p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link to="/shop" className="inline-flex min-h-11 items-center rounded-[2px] bg-accent px-4 text-sm font-semibold text-primaryForeground">
            Explore Products
          </Link>
          <Link to="/builder" className="inline-flex min-h-11 items-center rounded-[2px] border border-border px-4 text-sm font-semibold text-foreground">
            Build Your PC
          </Link>
        </div>
      </section>
    </div>
    </>
  );
}
