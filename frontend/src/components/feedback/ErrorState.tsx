import { AlertTriangle } from 'lucide-react';

type ErrorStateProps = {
  title?: string;
  description?: string;
  onRetry?: () => void;
};

export function ErrorState({
  title = 'Unable to load data',
  description = 'Please check your connection and try again.',
  onRetry
}: ErrorStateProps) {
  return (
    <section className="rounded-2xl border border-danger/40 bg-danger/10 p-6 text-danger">
      <div className="flex items-start gap-3">
        <AlertTriangle className="mt-0.5 h-5 w-5" />
        <div>
          <h2 className="text-base font-semibold">{title}</h2>
          <p className="mt-1 text-sm text-foreground">{description}</p>
          {onRetry ? (
            <button
              type="button"
              onClick={onRetry}
              className="mt-4 min-h-11 rounded-full border border-danger/50 px-4 text-sm font-semibold text-danger transition hover:bg-danger/20"
            >
              Retry
            </button>
          ) : null}
        </div>
      </div>
    </section>
  );
}
