import { MessageCircle, ShieldCheck } from 'lucide-react';
import { buildWhatsAppUrl } from '../../utils/whatsapp';

export function Topbar() {
  return (
    <div className="border-b border-border bg-surface text-xs text-muted">      
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-2 sm:px-6 lg:px-8">
        <p className="inline-flex items-center gap-2">
          <ShieldCheck className="h-3.5 w-3.5" />
          Premium PC hardware support across Tanzania and beyond
        </p>
        <a
          href={buildWhatsAppUrl()}
          rel="noreferrer"
          className="inline-flex min-h-11 items-center gap-1 text-foreground transition hover:text-accent"
        >
          <MessageCircle className="h-3.5 w-3.5" />
          WhatsApp Consult
        </a>
      </div>
    </div>
  );
}
