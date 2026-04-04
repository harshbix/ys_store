import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '../../lib/cn';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  fullWidth?: boolean;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary: 'bg-accent text-primaryForeground shadow-soft hover:bg-accentHover',
  secondary: 'border border-border bg-surface text-foreground hover:bg-surfaceHover',
  ghost: 'text-foreground hover:bg-surfaceHover',
  danger: 'bg-danger text-primaryForeground hover:opacity-90'
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'h-9 px-3 text-[12px]',
  md: 'h-10 px-4 text-[13px]',
  lg: 'h-11 px-5 text-[14px]'
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    className,
    children,
    variant = 'primary',
    size = 'md',
    loading = false,
    disabled,
    fullWidth = false,
    type = 'button',
    ...props
  },
  ref
) {
  const isDisabled = Boolean(disabled || loading);

  return (
    <button
      ref={ref}
      type={type}
      disabled={isDisabled}
      className={cn(
        'relative inline-flex select-none items-center justify-center gap-2 rounded-[2px] font-medium shadow-sm transition duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring hover:-translate-y-0.5 hover:scale-[1.02] hover:shadow-lg active:translate-y-px active:scale-[0.985] disabled:cursor-not-allowed disabled:opacity-65',
        variantClasses[variant],
        sizeClasses[size],
        fullWidth && 'w-full',
        className
      )}
      {...props}
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : null}
      <span className={cn(loading && 'opacity-90')}>{children}</span>
    </button>
  );
});
