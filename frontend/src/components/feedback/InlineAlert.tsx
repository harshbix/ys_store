import { AlertCircle } from 'lucide-react';
import { cn } from '../../lib/cn';

type InlineAlertProps = {
  message: string;
  tone?: 'error' | 'info' | 'success';
};

export function InlineAlert({ message, tone = 'info' }: InlineAlertProps) {
  return (
    <p
      className={cn(
        'inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm',
        tone === 'error' && 'border-danger/40 bg-danger/10 text-danger',
        tone === 'info' && 'border-border bg-surfaceElevated text-muted',
        tone === 'success' && 'border-success/40 bg-success/10 text-success'
      )}
    >
      <AlertCircle className="h-4 w-4" />
      {message}
    </p>
  );
}
