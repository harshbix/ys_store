import { forwardRef, type InputHTMLAttributes } from 'react';
import { cn } from '../../lib/cn';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: string;
  label?: string;
  hint?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { className, error, label, hint, id, ...props },
  ref
) {
  const inputId = id || props.name || Math.random().toString(36).substring(7);
  const errorId = `${inputId}-error`;
  const hintId = `${inputId}-hint`;

  return (
    <div className="space-y-1.5">
      {label ? (
        <label htmlFor={inputId} className="block label-11 text-secondary">
          {label}
        </label>
      ) : null}
      <input
        id={inputId}
        ref={ref}
        aria-invalid={!!error}
        aria-describedby={
          error ? errorId : hint ? hintId : undefined
        }
        className={cn(
          'h-10 w-full block rounded-[2px] border bg-inputBg px-3 text-[13px] text-foreground placeholder-muted transition focus-visible:border-ring focus-visible:outline-none focus:ring-1 focus:ring-ring',
          error ? 'border-danger' : 'border-border',
          className
        )}
        {...props}
      />
      {error ? (
        <p id={errorId} className="text-[12px] text-danger" role="alert">
          {error}
        </p>
      ) : null}
      {!error && hint ? (
        <p id={hintId} className="text-[12px] text-muted">
          {hint}
        </p>
      ) : null}
    </div>
  );
});
