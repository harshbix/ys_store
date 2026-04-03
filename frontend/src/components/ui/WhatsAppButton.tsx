import { MessageCircle } from 'lucide-react';

type WhatsAppButtonProps = {
  href?: string;
  label?: string;
  className?: string;
  onBeforeNavigate?: () => Promise<void>;
};

export function WhatsAppButton({ href, label = 'Continue to WhatsApp', className, onBeforeNavigate }: WhatsAppButtonProps) {
  const disabled = !href;

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={async () => {
        if (!href) return;
        if (onBeforeNavigate) {
          try {
            await onBeforeNavigate();
          } catch {
            // Navigation should continue even if tracking fails.
          }
        }
        window.location.href = href;
      }}
      className={className || 'inline-flex min-h-11 items-center gap-2 rounded-full bg-primary px-5 text-sm font-semibold text-primaryForeground disabled:opacity-40'}
    >
      <MessageCircle className="h-4 w-4" />
      {label}
    </button>
  );
}
