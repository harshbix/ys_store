import { forwardRef, type TextareaHTMLAttributes } from 'react';
import { cn } from '../../lib/cn';

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: string;
  label?: string;
  hint?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { className, error, label, hint, id, ...props },
  ref
) {
  const inputId = id || props.name;

  return (
    <label className="block space-y-1.5">
      {label ? <span className="label-11 text-secondary">{label}</span> : null}
      <textarea
        id={inputId}
        ref={ref}
        className={cn(
          'min-h-28 w-full rounded-[2px] border bg-inputBg px-3 py-2.5 text-[13px] text-foreground placeholder:text-muted transition focus-visible:border-ring focus-visible:outline-none',
          error ? 'border-danger' : 'border-border',
          className
        )}
        {...props}
      />
      {error ? <p className="text-[12px] text-danger">{error}</p> : null}
      {!error && hint ? <p className="text-[12px] text-muted">{hint}</p> : null}
    </label>
  );
});
