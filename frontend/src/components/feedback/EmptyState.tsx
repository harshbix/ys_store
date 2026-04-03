import { Inbox } from 'lucide-react';
import { Link } from 'react-router-dom';

type EmptyStateProps = {
  title: string;
  description: string;
  actionLabel?: string;
  actionHref?: string;
};

export function EmptyState({ title, description, actionLabel, actionHref }: EmptyStateProps) {
  return (
    <section className="rounded-2xl border border-dashed border-border bg-surface p-8 text-center">
      <Inbox className="mx-auto h-10 w-10 text-muted" />
      <h2 className="mt-4 text-lg font-semibold text-foreground">{title}</h2>
      <p className="mt-2 text-sm text-muted">{description}</p>
      {actionLabel && actionHref ? (
        <Link
          to={actionHref}
          className="mt-5 inline-flex min-h-11 items-center rounded-full border border-border px-5 text-sm font-semibold text-foreground transition hover:border-accent hover:text-accent"
        >
          {actionLabel}
        </Link>
      ) : null}
    </section>
  );
}
