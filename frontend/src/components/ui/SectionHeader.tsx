import { Link } from 'react-router-dom';

type SectionHeaderProps = {
  title: string;
  subtitle?: string;
  viewAllTo?: string;
};

export function SectionHeader({ title, subtitle, viewAllTo }: SectionHeaderProps) {
  return (
    <div className="mb-3 flex items-end justify-between gap-2">
      <div>
        <h2 className="font-display text-xl font-semibold text-foreground">{title}</h2>
        {subtitle ? <p className="mt-1 text-sm text-muted">{subtitle}</p> : null}
      </div>
      {viewAllTo ? (
        <Link to={viewAllTo} className="min-h-11 rounded-full border border-border px-4 py-2 text-xs font-semibold uppercase tracking-wide text-foreground transition hover:border-accent hover:text-accent">
          View All
        </Link>
      ) : null}
    </div>
  );
}
