import { Card, CardContent } from '../ui/card';

interface AdminStatCardProps {
  label: string;
  value: string;
  helper?: string;
}

export function AdminStatCard({ label, value, helper }: AdminStatCardProps) {
  return (
    <Card className="border-border/80 bg-surface/90 shadow-sm">
      <CardContent className="space-y-2 p-5">
        <p className="text-xs font-medium uppercase tracking-[0.12em] text-secondary">{label}</p>
        <p className="text-3xl font-semibold tracking-tight text-foreground">{value}</p>
        {helper ? <p className="text-xs text-muted">{helper}</p> : null}
      </CardContent>
    </Card>
  );
}
