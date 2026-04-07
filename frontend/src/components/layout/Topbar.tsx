import { MessageCircle, ShieldCheck } from 'lucide-react';
import { buildWhatsAppUrl } from '../../utils/whatsapp';

export function Topbar() {
  return (
    <div className="border-b border-border/60 bg-surface/70 text-xs text-muted backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-2 sm:px-6 lg:px-8">
        <p className="inline-flex items-center gap-2 tracking-[0.02em]">
          <ShieldCheck className="h-3.5 w-3.5 text-accent" />
          Premium PC hardware support across Tanzania and beyond
        </p>
        <a
          href={buildWhatsAppUrl()}
          rel="noreferrer"
          className="inline-flex min-h-11 items-center gap-1 rounded-full border border-border/60 px-3 text-foreground transition hover:border-accent/40 hover:text-accent"
        >
          <MessageCircle className="h-3.5 w-3.5" />
          WhatsApp Consult
        </a>
      </div>
    </div>
  );
}
