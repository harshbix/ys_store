import { forwardRef, type SelectHTMLAttributes } from 'react';
import { cn } from '../../lib/cn';

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  error?: string;
  label?: string;
  hint?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { className, error, label, hint, id, children, ...props },
  ref
) {
  const inputId = id || props.name;

  return (
    <label className="block space-y-1.5">
      {label ? <span className="label-11 text-secondary">{label}</span> : null}
      <select
        id={inputId}
        ref={ref}
        className={cn(
          'h-10 w-full rounded-[2px] border bg-inputBg px-3 text-[13px] text-foreground transition focus-visible:border-ring focus-visible:outline-none',
          error ? 'border-danger' : 'border-border',
          className
        )}
        {...props}
      >
        {children}
      </select>
      {error ? <p className="text-[12px] text-danger">{error}</p> : null}
      {!error && hint ? <p className="text-[12px] text-muted">{hint}</p> : null}
    </label>
  );
});
