import type { BuildPayload } from '../../types/api';
import { formatTzs } from '../../lib/currency';
import { Card } from '../ui/card';

type BuildSummaryProps = {
  build: BuildPayload;
};

export function BuildSummary({ build }: BuildSummaryProps) {
  const partsTotal = build.total_estimated_price_tzs || 0;
  const buildingFee = 50000;
  const combinedTotal = partsTotal + buildingFee;

  return (
    <Card className="p-5 space-y-4">
      {/* Total Price - Prominent */}
      <div className="rounded-xl bg-gradient-to-br from-primary to-primary/80 p-6 text-primary-foreground">
        <p className="text-xs font-medium uppercase tracking-wider opacity-90">Total Build Price</p>
        <p className="text-4xl font-bold mt-2">{formatTzs(combinedTotal)}</p>
        <div className="mt-4 pt-4 border-t border-primary-foreground/20 space-y-2">
          <div className="flex justify-between text-sm opacity-90">
            <span>Parts Subtotal</span>
            <span>{formatTzs(partsTotal)}</span>
          </div>
          <div className="flex justify-between text-sm font-semibold opacity-90">
            <span>Building Fee</span>
            <span>{formatTzs(buildingFee)}</span>
          </div>
        </div>
        <div className="mt-4 pt-4 border-t border-primary-foreground/20 text-sm space-y-1">
          <p className="text-xs uppercase tracking-wide opacity-90">Status: <span className="font-semibold capitalize">{build.compatibility_status}</span></p>
        </div>
      </div>

      {/* Summary Stats */}
      <dl className="space-y-3 text-sm">
        <div className="flex items-center justify-between">
          <dt className="text-muted-foreground">Components Selected</dt>
          <dd className="font-semibold text-foreground">{build.items.length}</dd>
        </div>
        <div className="flex items-center justify-between">
          <dt className="text-muted-foreground">Build Code</dt>
          <dd className="font-mono text-xs text-foreground bg-muted px-2 py-1 rounded">{build.build_code}</dd>
        </div>
      </dl>
    </Card>
  );
}
