import { Card, CardContent } from '../ui/card';

interface AdminStatCardProps {
  label: string;
  value: string;
  helper?: string;
}

export function AdminStatCard({ label, value, helper }: AdminStatCardProps) {
  return (
    <Card className="h-full border-border/80 bg-surface/90 shadow-sm">
      <CardContent className="flex h-full flex-col justify-between gap-2 p-4 sm:p-5">
        <p className="text-xs font-medium uppercase tracking-[0.12em] text-secondary">{label}</p>
        <p className="text-2xl font-semibold tracking-tight text-foreground sm:text-[1.75rem]">{value}</p>
        {helper ? <p className="text-xs text-muted">{helper}</p> : null}
      </CardContent>
    </Card>
  );
}
