import type { BuildPayload } from '../../types/api';
import { formatTzs } from '../../lib/currency';

type BuildSummaryProps = {
  build: BuildPayload;
};

export function BuildSummary({ build }: BuildSummaryProps) {
  return (
    <aside className="rounded-2xl border border-border bg-surface p-5">
      <h2 className="text-base font-semibold text-foreground">Build Summary</h2>
      <p className="mt-1 text-xs text-muted">Code: {build.build_code}</p>

      <dl className="mt-4 space-y-3 text-sm">
        <div className="flex items-center justify-between text-muted">
          <dt>Components</dt>
          <dd>{build.items.length}</dd>
        </div>
        <div className="flex items-center justify-between text-muted">
          <dt>Status</dt>
          <dd className="capitalize">{build.compatibility_status}</dd>
        </div>
        <div className="flex items-center justify-between text-foreground">
          <dt className="font-semibold">Estimated Total</dt>
          <dd className="font-semibold">{formatTzs(build.total_estimated_price_tzs)}</dd>
        </div>
      </dl>
    </aside>
  );
}
