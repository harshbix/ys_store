import { cn } from '../../lib/cn';

interface OtpCodeInputProps {
  id?: string;
  value: string;
  onChange: (nextValue: string) => void;
  length?: number;
  disabled?: boolean;
}

export function OtpCodeInput({ id = 'code-input', value, onChange, length = 6, disabled = false }: OtpCodeInputProps) {
  const normalizedValue = value.replace(/\D/g, '').slice(0, length);

  return (
    <div className="space-y-2">
      <input
        id={id}
        value={normalizedValue}
        onChange={(event) => onChange(event.target.value.replace(/\D/g, '').slice(0, length))}
        inputMode="numeric"
        pattern="[0-9]*"
        autoComplete="one-time-code"
        disabled={disabled}
        className="sr-only"
      />

      <label htmlFor={id} className="block cursor-text rounded-[2px] border border-border bg-inputBg p-2.5">
        <div className="grid grid-cols-6 gap-2">
          {Array.from({ length }).map((_, index) => {
            const char = normalizedValue[index] || '';
            return (
              <div
                key={`otp-cell-${index}`}
                className={cn(
                  'flex h-11 items-center justify-center rounded-[2px] border text-center font-mono text-[18px] tracking-[0.08em] transition',
                  char ? 'border-ring text-foreground' : 'border-border text-muted'
                )}
              >
                {char || '•'}
              </div>
            );
          })}
        </div>
      </label>
    </div>
  );
}
