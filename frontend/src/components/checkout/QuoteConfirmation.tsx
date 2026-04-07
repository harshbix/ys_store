import { CheckCircle2, Copy } from 'lucide-react';
import type { QuoteRecord } from '../../types/api';
import { formatTzs } from '../../lib/currency';
import { WhatsAppButton } from '../ui/WhatsAppButton';

type QuoteConfirmationProps = {
  quote: QuoteRecord;
  whatsappUrl: string;
  onTrackAndOpen: () => Promise<void>;
};

export function QuoteConfirmation({ quote, whatsappUrl, onTrackAndOpen }: QuoteConfirmationProps) {
  return (
    <section className="rounded-2xl border border-success/40 bg-success/10 p-5 text-foreground">
      <div className="flex items-start gap-3">
        <CheckCircle2 className="mt-0.5 h-5 w-5 text-success" />
        <div>
          <h2 className="text-base font-semibold">Quote Ready</h2>
          <p className="mt-1 text-sm text-muted">Share this quote with our team to continue on WhatsApp.</p>
        </div>
      </div>

      <div className="mt-4 grid gap-3 rounded-xl border border-border bg-background p-4 sm:grid-cols-2">
        <p className="text-sm text-muted">Quote Code: <span className="font-semibold text-foreground">{quote.quote_code}</span></p>
        <p className="text-sm text-muted">Estimated Total: <span className="font-semibold text-foreground">{formatTzs(quote.estimated_total_tzs)}</span></p>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => navigator.clipboard.writeText(quote.quote_code)}
          className="inline-flex min-h-11 items-center gap-2 rounded-full border border-border px-5 text-sm font-semibold text-foreground"
        >
          <Copy className="h-4 w-4" />
          Copy Quote Code
        </button>
        <WhatsAppButton href={whatsappUrl} onBeforeNavigate={onTrackAndOpen} />
      </div>
    </section>
  );
}
