import { Minus, Plus } from 'lucide-react';

type QuantityStepperProps = {
  value: number;
  min?: number;
  max?: number;
  disabled?: boolean;
  onChange: (next: number) => void;
};

export function QuantityStepper({ value, min = 1, max = 99, disabled, onChange }: QuantityStepperProps) {
  return (
    <div className="inline-flex min-h-11 items-center rounded-lg border border-border bg-surfaceElevated">
      <button
        type="button"
        disabled={disabled || value <= min}
        onClick={() => onChange(Math.max(min, value - 1))}
        className="inline-flex min-h-11 min-w-11 items-center justify-center text-muted disabled:opacity-40"
        aria-label="Decrease quantity"
      >
        <Minus className="h-4 w-4" />
      </button>
      <span className="w-8 text-center text-sm font-semibold">{value}</span>
      <button
        type="button"
        disabled={disabled || value >= max}
        onClick={() => onChange(Math.min(max, value + 1))}
        className="inline-flex min-h-11 min-w-11 items-center justify-center text-muted disabled:opacity-40"
        aria-label="Increase quantity"
      >
        <Plus className="h-4 w-4" />
      </button>
    </div>
  );
}
